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

interface RepoMeta {
  description: string;
  topics: string[];
  stars: number;
  forks: number;
  language: string;
  homepage: string;
}

// ── GitHub helpers ──────────────────────────────────────

function ghHeaders(githubToken?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'RepoToContent-AI',
  };
  if (githubToken) h['Authorization'] = `Bearer ${githubToken}`;
  return h;
}

async function fetchGitHubJSON(url: string, githubToken?: string): Promise<any> {
  const res = await fetch(url, { headers: ghHeaders(githubToken) });
  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      throw new Error('GitHub authentication failed. Please check your token has repo access.');
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

async function fetchRawFile(url: string, githubToken?: string): Promise<string> {
  const h: Record<string, string> = {};
  if (githubToken) h['Authorization'] = `Bearer ${githubToken}`;
  const res = await fetch(url, { headers: h });
  if (!res.ok) return "";
  return res.text();
}

// ── Deeper context gathering ────────────────────────────

async function gatherRepoContext(owner: string, repo: string, githubToken?: string): Promise<string> {
  let context = `Repository: ${owner}/${repo}\n\n`;

  // 1. Repo metadata (description, topics, stars, language)
  try {
    const meta = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}`, githubToken);
    if (meta) {
      const m: RepoMeta = {
        description: meta.description || '',
        topics: meta.topics || [],
        stars: meta.stargazers_count || 0,
        forks: meta.forks_count || 0,
        language: meta.language || 'Unknown',
        homepage: meta.homepage || '',
      };
      context += `=== Repository Metadata ===\nDescription: ${m.description}\nTopics: ${m.topics.join(', ')}\nStars: ${m.stars} | Forks: ${m.forks}\nPrimary Language: ${m.language}\n`;
      if (m.homepage) context += `Homepage: ${m.homepage}\n`;
      context += '\n';
    }
  } catch (e) {
    console.log('Could not fetch repo metadata:', e);
  }

  // 2. Root directory contents
  let files: GitHubFile[] = [];
  try {
    const rootContents = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}/contents/`, githubToken);
    if (Array.isArray(rootContents)) files = rootContents;
  } catch (error) {
    console.error('Error fetching root contents:', error);
    throw error;
  }

  // 3. Priority documentation files
  const priorityFiles = ['README.md', 'readme.md', 'README', 'package.json', 'Cargo.toml', 'pyproject.toml', 'setup.py', 'pom.xml', 'build.gradle'];
  const extraDocs = ['CONTRIBUTING.md', 'CHANGELOG.md', 'HISTORY.md', 'docs/README.md'];

  for (const pf of priorityFiles) {
    const file = files.find(f => f.name.toLowerCase() === pf.toLowerCase());
    if (file?.download_url) {
      const content = await fetchRawFile(file.download_url, githubToken);
      if (content) context += `=== ${file.name} ===\n${content.slice(0, 8000)}\n\n`;
    }
  }

  // 4. Extra documentation files
  for (const docPath of extraDocs) {
    try {
      const docData = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}/contents/${docPath}`, githubToken);
      if (docData?.download_url) {
        const content = await fetchRawFile(docData.download_url, githubToken);
        if (content) context += `=== ${docPath} ===\n${content.slice(0, 3000)}\n\n`;
      }
    } catch { /* skip */ }
  }

  // 5. Directory structure
  context += "=== Directory Structure ===\n";
  for (const file of files.slice(0, 30)) {
    context += `${file.type === 'dir' ? '📁' : '📄'} ${file.name}\n`;
  }

  // 6. Source folder structure + sample source files
  const srcDir = files.find(f => (f.name === 'src' || f.name === 'lib' || f.name === 'app') && f.type === 'dir');
  if (srcDir) {
    try {
      const srcFiles: GitHubFile[] = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}/contents/${srcDir.name}`, githubToken) || [];
      context += `\n=== ${srcDir.name}/ Structure ===\n`;
      for (const file of srcFiles.slice(0, 20)) {
        context += `  ${file.type === 'dir' ? '📁' : '📄'} ${file.name}\n`;
      }

      // Read up to 3 key source files for deeper understanding
      const codeFiles = srcFiles.filter(f => f.type === 'file' && /\.(ts|js|py|rs|go|java|rb)$/i.test(f.name)).slice(0, 3);
      for (const cf of codeFiles) {
        if (cf.download_url) {
          const src = await fetchRawFile(cf.download_url, githubToken);
          if (src) context += `\n=== Source: ${srcDir.name}/${cf.name} ===\n${src.slice(0, 2000)}\n`;
        }
      }
    } catch { console.log(`Could not fetch ${srcDir.name} contents`); }
  }

  // 7. Latest release notes
  try {
    const release = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, githubToken);
    if (release) {
      context += `\n=== Latest Release: ${release.tag_name} ===\n${(release.body || '').slice(0, 2000)}\n`;
    }
  } catch { /* no releases */ }

  return context;
}

// ── Tool schema (shared for generation & refinement) ────

const contentScoresSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['relevance', 'engagement', 'clarity'],
  properties: {
    relevance: { type: 'number' },
    engagement: { type: 'number' },
    clarity: { type: 'number' },
  },
};

function buildGenerationToolSchema() {
  return {
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
            required: ['name', 'whatItDoes', 'targetUsers', 'keyFeatures', 'valueProps', 'useCases', 'techStack'],
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
  };
}

function buildRefinementToolSchema() {
  return {
    type: 'function',
    function: {
      name: 'refine_content',
      description: 'Return the refined marketing content with quality scores for every item.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['content'],
        properties: {
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
                  required: ['platform', 'content', 'scores'],
                  properties: {
                    platform: { type: 'string' },
                    content: { type: 'string' },
                    scores: contentScoresSchema,
                  },
                },
              },
              blogArticles: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['title', 'content', 'scores'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    sections: { type: 'array', items: { type: 'string' } },
                    scores: contentScoresSchema,
                  },
                },
              },
              caseStudies: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['title', 'client', 'industry', 'problem', 'solution', 'outcomes', 'content', 'scores'],
                  properties: {
                    title: { type: 'string' },
                    client: { type: 'string' },
                    industry: { type: 'string' },
                    problem: { type: 'string' },
                    solution: { type: 'string' },
                    outcomes: { type: 'array', items: { type: 'string' } },
                    content: { type: 'string' },
                    scores: contentScoresSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

// ── Preference instruction builder ──────────────────────

function buildPreferenceInstructions(preferences?: any): string {
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

  return `
CONTENT STYLE GUIDELINES:
${preferences?.tone ? toneMap[preferences.tone] || toneMap.professional : toneMap.professional}
${preferences?.audience ? audienceMap[preferences.audience] || audienceMap.developers : audienceMap.developers}
${preferences?.industry ? industryMap[preferences.industry] || '' : ''}
${preferences?.voice ? voiceMap[preferences.voice] || voiceMap.friendly : voiceMap.friendly}

Apply these style guidelines consistently across ALL generated content.
`;
}

// ── AI call helper ──────────────────────────────────────

async function callAI(body: Record<string, unknown>): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error('AI Gateway error:', res.status, txt);
    if (res.status === 429) throw { status: 429, message: 'Rate limit exceeded. Please try again in a moment.' };
    if (res.status === 402) throw { status: 402, message: 'AI credits exhausted. Please add funds to continue.' };
    throw new Error(`AI Gateway error: ${res.status}`);
  }
  return res.json();
}

function extractToolArgs(aiResponse: any): any | null {
  const msg = aiResponse.choices?.[0]?.message;
  const toolArgs = msg?.tool_calls?.[0]?.function?.arguments ?? (msg as any)?.function_call?.arguments;
  if (toolArgs) {
    try {
      return JSON.parse(typeof toolArgs === 'string' ? toolArgs : JSON.stringify(toolArgs));
    } catch { /* fall through */ }
  }
  // Fallback: parse from content
  const content = msg?.content;
  if (content) {
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      return JSON.parse(jsonMatch[1].trim());
    } catch { /* fall through */ }
  }
  return null;
}

// ── Main handler ────────────────────────────────────────

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

    // ── STEP 1: Gather deep repo context ──
    const repoContext = await gatherRepoContext(owner, repoName, githubToken);
    console.log(`Gathered ${repoContext.length} characters of context`);

    const prefInstructions = buildPreferenceInstructions(preferences);

    // ── STEP 2: Pass 1 – Generate content with marketing frameworks ──
    const generationPrompt = `You are an expert product analyst and content marketer.

IMPORTANT: You MUST return your result by calling the provided tool and passing arguments that match the required schema.

${prefInstructions}

Analyze the provided GitHub repository and generate comprehensive marketing content.

=== MARKETING FRAMEWORK INSTRUCTIONS ===

**Social Posts – Use the AIDA Framework:**
For each social post, structure the content as:
1. ATTENTION: Open with a bold hook, surprising stat, or provocative question
2. INTEREST: Build curiosity about the problem being solved
3. DESIRE: Show how the product uniquely solves it – highlight key benefits
4. ACTION: End with a clear call-to-action (try it, star it, check it out)
- Twitter posts: Under 280 chars, punchy, use relevant hashtags
- LinkedIn posts: 2-3 professional paragraphs with thought-leadership angle

**Blog Articles – Use the PAS Framework:**
Structure each article as:
1. PROBLEM: Open with the pain point your audience faces (make it relatable)
2. AGITATE: Amplify the pain – show what happens if it's not solved, the cost of inaction
3. SOLUTION: Present the repository/product as the answer, with concrete examples and proof
- Minimum 500 words per article
- Include practical examples and code snippets where relevant
- Use headers and scannable formatting

**Case Studies – Use the STAR Framework:**
Structure each case study as:
1. SITUATION: Set the scene – who is the client, what's their context
2. TASK: What specific challenge did they need to solve
3. ACTION: How they implemented the solution using this product
4. RESULT: Quantifiable outcomes with realistic metrics
- Make companies and scenarios feel authentic and plausible
- Include 3+ measurable outcomes per case study

=== CRITICAL RULES ===
- Base ALL content ONLY on what the repository actually does – NO invented features
- Make content accessible to non-technical readers
- Focus on benefits and outcomes, not just features
- Use concrete examples and scenarios
- NEVER use em dashes (the long dash character "\u2014"). Use periods, commas, colons, or semicolons instead.`;

    console.log('Pass 1: Generating content with marketing frameworks...');
    const pass1Response = await callAI({
      model: 'google/gemini-3-flash-preview',
      tools: [buildGenerationToolSchema()],
      tool_choice: { type: 'function', function: { name: 'generate_repo_marketing' } },
      messages: [
        { role: 'system', content: generationPrompt },
        { role: 'user', content: `Analyze this GitHub repository and generate marketing content:\n\n${repoContext}` },
      ],
      temperature: 0.7,
      max_tokens: 12000,
    });

    const draft = extractToolArgs(pass1Response);
    if (!draft) throw new Error('Failed to parse AI generation response');
    console.log('Pass 1 complete. Starting refinement pass...');

    // ── STEP 3: Pass 2 – Refine & Score ──
    const refinementPrompt = `You are a senior content editor and quality analyst. You will receive draft marketing content generated from a GitHub repository analysis.

Your job is to:
1. REFINE each piece of content:
   - Remove any hallucinated features not supported by the repository data
   - Strengthen weak hooks and calls-to-action
   - Ensure platform-appropriate formatting (tweets under 280 chars, LinkedIn is professional)
   - Tighten prose – remove filler words and vague claims
   - Improve readability and flow

2. SCORE each piece of content on three dimensions (1-10 scale):
   - **Relevance** (1-10): How accurately it reflects actual repository capabilities
   - **Engagement** (1-10): How compelling, shareable, and attention-grabbing it is
   - **Clarity** (1-10): How easy it is for the target audience to understand

IMPORTANT: NEVER use em dashes (the long dash character "\u2014"). Replace any you find with periods, commas, colons, or semicolons.

Return the refined content with scores by calling the provided tool.

Here is the original repository context for fact-checking:
${repoContext.slice(0, 4000)}`;

    const pass2Response = await callAI({
      model: 'google/gemini-3-flash-preview',
      tools: [buildRefinementToolSchema()],
      tool_choice: { type: 'function', function: { name: 'refine_content' } },
      messages: [
        { role: 'system', content: refinementPrompt },
        { role: 'user', content: `Please refine and score this draft content:\n\n${JSON.stringify(draft.content, null, 2)}` },
      ],
      temperature: 0.3,
      max_tokens: 12000,
    });

    const refined = extractToolArgs(pass2Response);
    console.log('Pass 2 (refinement) complete.');

    // Merge refined content back, keeping summary and scenarios from pass 1
    const finalContent = refined?.content || draft.content;

    const result = {
      repoUrl,
      analyzedAt: new Date().toISOString(),
      refinedAt: refined ? new Date().toISOString() : undefined,
      summary: draft.summary,
      scenarios: draft.scenarios,
      content: finalContent,
    };

    console.log('Analysis complete with refinement and scoring');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error analyzing repository:', error);
    const status = error?.status || 500;
    return new Response(
      JSON.stringify({ error: error?.message || error?.toString() || 'Failed to analyze repository' }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
