import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

function buildRegenerationToolSchema(contentType: string) {
  const schemas: Record<string, any> = {
    social: {
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
    blog: {
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
    casestudies: {
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
  };

  return {
    type: 'function',
    function: {
      name: 'regenerate_content',
      description: `Regenerate and score ${contentType} content.`,
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['items'],
        properties: {
          items: schemas[contentType] || schemas.social,
        },
      },
    },
  };
}

function getFrameworkInstructions(contentType: string): string {
  const frameworks: Record<string, string> = {
    social: `Use the AIDA Framework for each social post:
1. ATTENTION: Bold hook, surprising stat, or provocative question
2. INTEREST: Build curiosity about the problem being solved
3. DESIRE: Show how the product uniquely solves it
4. ACTION: Clear call-to-action
- Twitter: Under 280 chars, punchy, relevant hashtags
- LinkedIn: 2-3 professional paragraphs with thought-leadership angle`,
    blog: `Use the PAS Framework for each article:
1. PROBLEM: Open with the pain point (make it relatable)
2. AGITATE: Amplify the pain – cost of inaction
3. SOLUTION: Present the product as the answer with concrete examples
- Minimum 500 words per article
- Include practical examples
- Use headers and scannable formatting`,
    casestudies: `Use the STAR Framework for each case study:
1. SITUATION: Set the scene – who, what context
2. TASK: What specific challenge to solve
3. ACTION: How they implemented the solution
4. RESULT: Quantifiable outcomes with realistic metrics
- Make companies feel authentic
- Include 3+ measurable outcomes`,
  };
  return frameworks[contentType] || frameworks.social;
}

function buildPreferenceInstructions(preferences?: any): string {
  const toneMap: Record<string, string> = {
    professional: 'Use a polished, business-appropriate tone.',
    casual: 'Use a friendly, approachable, conversational tone.',
    technical: 'Use a detailed, developer-focused, technical tone.',
    playful: 'Use a fun, creative, and engaging tone.',
    enterprise: 'Use a formal, corporate, executive-level tone.',
  };
  const audienceMap: Record<string, string> = {
    developers: 'Target software engineers and technical users.',
    business: 'Target CTOs, VPs, and business decision makers.',
    startups: 'Target founders and early-stage teams.',
    enterprise: 'Target large organizations.',
    general: 'Target a non-technical audience.',
  };

  return `${preferences?.tone ? toneMap[preferences.tone] || '' : toneMap.professional}
${preferences?.audience ? audienceMap[preferences.audience] || '' : audienceMap.developers}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoUrl, summary, preferences, contentType, itemIndex } = await req.json();

    if (!contentType || !summary) {
      return new Response(
        JSON.stringify({ error: 'contentType and summary are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    console.log(`Regenerating ${contentType}${itemIndex !== undefined ? ` item ${itemIndex}` : ' (all)'} for ${repoUrl}`);

    const contentTypeLabel: Record<string, string> = {
      social: 'social media posts',
      blog: 'blog articles',
      casestudies: 'case studies',
    };

    const prefInstructions = buildPreferenceInstructions(preferences);
    const frameworkInstructions = getFrameworkInstructions(contentType);

    const countInstruction = itemIndex !== undefined
      ? 'Generate exactly 1 item.'
      : contentType === 'social' ? 'Generate 3 posts (at least 1 Twitter, 1 LinkedIn).'
      : 'Generate 2 items.';

    const systemPrompt = `You are an expert content marketer. Generate fresh ${contentTypeLabel[contentType] || 'content'} for a product.

${prefInstructions}

=== MARKETING FRAMEWORK ===
${frameworkInstructions}

=== QUALITY SCORING ===
For each item, also provide quality scores (1-10):
- Relevance: How accurately it reflects the product's actual capabilities
- Engagement: How compelling and shareable it is
- Clarity: How easy it is for the audience to understand

=== RULES ===
- Base ALL content ONLY on the product summary provided – NO invented features
- ${countInstruction}
- Make each piece distinct from the others, using different angles, hooks, and focus areas
- NEVER use em dashes (the long dash character "\u2014"). Use periods, commas, colons, or semicolons instead.
- Return results by calling the provided tool`;

    const userMessage = `Product Summary:
Name: ${summary.name}
What it does: ${summary.whatItDoes}
Target Users: ${summary.targetUsers?.join(', ')}
Key Features: ${summary.keyFeatures?.join(', ')}
Value Props: ${summary.valueProps?.join(', ')}
Use Cases: ${summary.useCases?.join(', ')}
Tech Stack: ${summary.techStack?.join(', ')}

Generate fresh, high-quality ${contentTypeLabel[contentType] || 'content'} with quality scores.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        tools: [buildRegenerationToolSchema(contentType)],
        tool_choice: { type: 'function', function: { name: 'regenerate_content' } },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.8,
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
    const msg = aiResponse.choices?.[0]?.message;
    const toolArgs = msg?.tool_calls?.[0]?.function?.arguments ?? (msg as any)?.function_call?.arguments;

    let result: any = null;
    if (toolArgs) {
      try {
        result = JSON.parse(typeof toolArgs === 'string' ? toolArgs : JSON.stringify(toolArgs));
      } catch { /* fall through */ }
    }

    if (!result) {
      throw new Error('Failed to parse regeneration response');
    }

    console.log(`Regeneration complete. Generated ${result.items?.length || 0} items.`);

    return new Response(
      JSON.stringify({ items: result.items, contentType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error regenerating content:', error);
    const status = error?.status || 500;
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to regenerate content' }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
