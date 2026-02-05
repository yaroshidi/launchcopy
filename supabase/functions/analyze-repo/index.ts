import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  download_url?: string;
}

async function fetchGitHubContent(owner: string, repo: string, path: string = "", githubToken?: string): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  console.log(`Fetching GitHub content from: ${url}`);
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'RepoToContent-AI'
  };
  
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
    console.log('Using GitHub token for authentication');
  }
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404 && !githubToken) {
      throw new Error('Repository not found. If this is a private repo, please provide a GitHub token.');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('GitHub authentication failed. Please check your token has repo access.');
    }
    console.error(`GitHub API error: ${response.status}`);
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.text();
}

async function fetchFileContent(downloadUrl: string, githubToken?: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }
  const response = await fetch(downloadUrl, { headers });
  if (!response.ok) return "";
  return response.text();
}

async function gatherRepoContext(owner: string, repo: string, githubToken?: string): Promise<string> {
  let context = `Repository: ${owner}/${repo}\n\n`;

  try {
    // Get root contents
    const rootContents = await fetchGitHubContent(owner, repo, "", githubToken);
    const files: GitHubFile[] = JSON.parse(rootContents);
    
    // Prioritize key files
    const priorityFiles = ['README.md', 'readme.md', 'README', 'package.json', 'Cargo.toml', 'pyproject.toml', 'setup.py', 'pom.xml', 'build.gradle'];
    
    for (const priorityFile of priorityFiles) {
      const file = files.find(f => f.name.toLowerCase() === priorityFile.toLowerCase());
      if (file && file.download_url) {
        const content = await fetchFileContent(file.download_url, githubToken);
        if (content) {
          context += `=== ${file.name} ===\n${content.slice(0, 8000)}\n\n`;
        }
      }
    }

    // List directory structure
    context += "=== Directory Structure ===\n";
    for (const file of files.slice(0, 30)) {
      context += `${file.type === 'dir' ? '📁' : '📄'} ${file.name}\n`;
    }

    // Try to get src or lib folder structure
    const srcDir = files.find(f => f.name === 'src' || f.name === 'lib' || f.name === 'app');
    if (srcDir && srcDir.type === 'dir') {
      try {
        const srcContents = await fetchGitHubContent(owner, repo, srcDir.name, githubToken);
        const srcFiles: GitHubFile[] = JSON.parse(srcContents);
        context += `\n=== ${srcDir.name}/ Structure ===\n`;
        for (const file of srcFiles.slice(0, 20)) {
          context += `  ${file.type === 'dir' ? '📁' : '📄'} ${file.name}\n`;
        }
      } catch (e) {
        console.log(`Could not fetch ${srcDir.name} contents`);
      }
    }

  } catch (error) {
    console.error('Error gathering repo context:', error);
    throw error;
  }

  return context;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoUrl, githubToken, preferences } = await req.json();
    
    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing repository: ${repoUrl}`);
    console.log('Preferences:', preferences);
    if (githubToken) {
      console.log('GitHub token provided for private repo access');
    }

    // Parse GitHub URL
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!urlMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [, owner, repo] = urlMatch;
    const repoName = repo.replace(/\.git$/, '');

    // Gather repository context
    const repoContext = await gatherRepoContext(owner, repoName, githubToken);
    console.log(`Gathered ${repoContext.length} characters of context`);

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build preference-aware prompt modifiers
    const toneMap: Record<string, string> = {
      professional: 'Use a polished, business-appropriate tone.',
      casual: 'Use a friendly, approachable, conversational tone.',
      technical: 'Use a detailed, developer-focused, technical tone with specific terminology.',
      playful: 'Use a fun, creative, and engaging tone with personality.',
      enterprise: 'Use a formal, corporate, executive-level tone.',
    };

    const audienceMap: Record<string, string> = {
      developers: 'Target software engineers and technical users who appreciate code details and technical accuracy.',
      business: 'Target CTOs, VPs, and business decision makers who focus on ROI and strategic value.',
      startups: 'Target founders and early-stage teams who value speed, innovation, and cost-effectiveness.',
      enterprise: 'Target large organizations that prioritize security, scalability, and compliance.',
      general: 'Target a non-technical audience who needs simple explanations without jargon.',
    };

    const industryMap: Record<string, string> = {
      general: '',
      saas: 'Frame content in the context of SaaS products and subscription businesses.',
      fintech: 'Frame content for the financial technology and banking sector.',
      healthcare: 'Frame content for healthcare and medical technology contexts.',
      ecommerce: 'Frame content for e-commerce and retail businesses.',
      devtools: 'Frame content for developer tools and productivity software.',
      'ai-ml': 'Frame content for AI/ML and data science applications.',
    };

    const voiceMap: Record<string, string> = {
      formal: 'Maintain a traditional, structured writing style.',
      friendly: 'Use a warm, conversational, approachable writing style.',
      authoritative: 'Project expertise and confidence in all statements.',
      innovative: 'Emphasize forward-thinking, cutting-edge perspectives.',
    };

    const toneInstruction = preferences?.tone ? toneMap[preferences.tone] || '' : toneMap.professional;
    const audienceInstruction = preferences?.audience ? audienceMap[preferences.audience] || '' : audienceMap.developers;
    const industryInstruction = preferences?.industry ? industryMap[preferences.industry] || '' : '';
    const voiceInstruction = preferences?.voice ? voiceMap[preferences.voice] || '' : voiceMap.friendly;

    const preferenceInstructions = `
CONTENT STYLE GUIDELINES:
${toneInstruction}
${audienceInstruction}
${industryInstruction}
${voiceInstruction}

Apply these style guidelines consistently across ALL generated content including social posts, blog articles, and case studies.
`;

    const systemPrompt = `You are an expert product analyst and content marketer.

IMPORTANT: You MUST return your result by calling the provided tool (function) and passing arguments that match the required schema. Do not output raw JSON in plain text.

${preferenceInstructions}

Analyze the provided GitHub repository and generate comprehensive marketing content.

You MUST respond with valid JSON matching this exact structure:
{
  "summary": {
    "name": "Product Name",
    "whatItDoes": "Clear description of what the project does (2-3 sentences)",
    "targetUsers": ["User type 1", "User type 2", "User type 3", "User type 4"],
    "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
    "valueProps": ["Value proposition 1", "Value proposition 2", "Value proposition 3", "Value proposition 4"],
    "useCases": ["Use case 1", "Use case 2", "Use case 3", "Use case 4"],
    "techStack": ["Tech 1", "Tech 2", "Tech 3"]
  },
  "scenarios": [
    "Realistic scenario 1 describing how a specific user type uses this",
    "Realistic scenario 2 with different industry",
    "Realistic scenario 3 with different company size"
  ],
  "content": {
    "socialPosts": [
      { "platform": "Twitter", "content": "Engaging tweet about the product (under 280 chars)" },
      { "platform": "LinkedIn", "content": "Professional LinkedIn post (2-3 paragraphs)" },
      { "platform": "Twitter", "content": "Another tweet with different angle" }
    ],
    "blogArticles": [
      {
        "title": "Article title",
        "content": "Full blog article in markdown format (500+ words)"
      },
      {
        "title": "Second article title", 
        "content": "Another full blog article (500+ words)"
      }
    ],
    "caseStudies": [
      {
        "title": "Case study title",
        "client": "Fictional Company Name",
        "industry": "Industry / Sector",
        "problem": "The problem they faced (2-3 sentences)",
        "solution": "How they used this product (2-3 sentences)",
        "outcomes": ["Outcome 1 with metric", "Outcome 2 with metric", "Outcome 3 with metric"],
        "content": "Full case study narrative (300+ words)"
      },
      {
        "title": "Second case study",
        "client": "Another Company",
        "industry": "Different Industry",
        "problem": "Different problem",
        "solution": "Different solution approach",
        "outcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
        "content": "Full case study narrative"
      }
    ]
  }
}

Guidelines:
- Base ALL content on what the repository actually does - no invented features
- Make content accessible to non-technical readers
- Focus on benefits and outcomes, not just features
- Use concrete examples and scenarios
- Keep social posts platform-appropriate (Twitter: punchy, LinkedIn: professional)
- Make case studies believable with realistic metrics`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_repo_marketing',
              description: 'Generate structured marketing content for a GitHub repository analysis.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                required: ['summary', 'scenarios', 'content'],
                properties: {
                  summary: {
                    type: 'object',
                    additionalProperties: false,
                    required: [
                      'name',
                      'whatItDoes',
                      'targetUsers',
                      'keyFeatures',
                      'valueProps',
                      'useCases',
                      'techStack',
                    ],
                    properties: {
                      name: { type: 'string' },
                      whatItDoes: { type: 'string' },
                      targetUsers: { type: 'array', items: { type: 'string' } },
                      keyFeatures: { type: 'array', items: { type: 'string' } },
                      valueProps: { type: 'array', items: { type: 'string' } },
                      useCases: { type: 'array', items: { type: 'string' } },
                      techStack: { type: 'array', items: { type: 'string' } },
                    },
                  },
                  scenarios: { type: 'array', items: { type: 'string' } },
                  content: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['socialPosts', 'blogArticles', 'caseStudies'],
                    properties: {
                      socialPosts: {
                        type: 'array',
                        items: {
                          type: 'object',
                          additionalProperties: false,
                          required: ['platform', 'content'],
                          properties: {
                            platform: { type: 'string' },
                            content: { type: 'string' },
                          },
                        },
                      },
                      blogArticles: {
                        type: 'array',
                        items: {
                          type: 'object',
                          additionalProperties: false,
                          required: ['title', 'content'],
                          properties: {
                            title: { type: 'string' },
                            content: { type: 'string' },
                            sections: { type: 'array', items: { type: 'string' } },
                          },
                        },
                      },
                      caseStudies: {
                        type: 'array',
                        items: {
                          type: 'object',
                          additionalProperties: false,
                          required: ['title', 'client', 'industry', 'problem', 'solution', 'outcomes', 'content'],
                          properties: {
                            title: { type: 'string' },
                            client: { type: 'string' },
                            industry: { type: 'string' },
                            problem: { type: 'string' },
                            solution: { type: 'string' },
                            outcomes: { type: 'array', items: { type: 'string' } },
                            content: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_repo_marketing' } },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this GitHub repository and generate marketing content:\n\n${repoContext}` }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const message = aiResponse.choices?.[0]?.message;

    console.log('AI response received, parsing structured output...');

    let analysis: any | undefined;

    // Prefer tool/function call output to guarantee valid JSON
    const toolArgs =
      message?.tool_calls?.[0]?.function?.arguments ??
      (message as any)?.function_call?.arguments;

    if (toolArgs) {
      try {
        const argsStr = typeof toolArgs === 'string' ? toolArgs : JSON.stringify(toolArgs);
        analysis = JSON.parse(argsStr);
      } catch (parseError) {
        console.error('Tool args JSON parse error:', parseError);
      }
    }

    // Fallback: try to parse JSON from message content (legacy)
    if (!analysis) {
      const content = message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const jsonStr = jsonMatch[1].trim();
        analysis = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw content:', content.slice(0, 500));
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Return the analysis with metadata
    const result = {
      repoUrl,
      analyzedAt: new Date().toISOString(),
      ...analysis
    };

    console.log('Analysis complete');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing repository:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to analyze repository' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
