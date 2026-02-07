import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const contentScoresSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['relevance', 'engagement', 'clarity', 'humanness'],
  properties: {
    relevance: { type: 'number' },
    engagement: { type: 'number' },
    clarity: { type: 'number' },
    humanness: { type: 'number' },
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
    social: `=== X POSTS ===
Write like a real developer posting, NOT a brand account.

HARD RULES (violating these means the post fails):
- STRICT 280 CHARACTER LIMIT. Count carefully. Aim for 200-260 characters to stay safe.
- Use \\n line breaks between sentences. Each sentence on its own line.
- NO hashtags whatsoever (X algorithm penalizes them)
- MAX 1 emoji per post, or zero. Never start with an emoji.
- Lowercase is fine and often preferred.
- Never use "Introducing..." or "Excited to announce..." or corporate phrasing
- MUST mention a SPECIFIC feature or capability, not generic praise

HIGH-PERFORMING X POST FORMATS (pick 3 different formats from this pool, never repeat):
1. Hot Take / Contrarian: Bold opinion referencing a SPECIFIC capability. Example: "unpopular opinion: most CI pipelines are over-engineered.\\nyou don't need 47 yaml files.\\n[product] does it in one command."
2. Problem then Discovery: Relatable frustration then solution reveal citing a SPECIFIC feature.
3. Concrete Result: Specific metric or before/after tied to actual capabilities.
4. The Confession: Admit a past belief, then show how the product changed your mind.
5. The List: A short list of specific things the product enables or eliminates.
6. The Question: One provocative question, answered in one line.
7. The Before/After: Raw comparison, no editorializing. Example: "before [product]: 200 lines of config.\\nafter: 12.\\nsame result."
8. The Understatement: Deliberately downplay something impressive.

TONE: Write as a peer sharing a genuine recommendation. Mild intensity ("genuinely insane", "absurdly good") is fine.

=== LINKEDIN POSTS ===
Write as a senior engineer sharing a genuine insight, NOT a company page.

HARD RULES:
- NO hashtags (LinkedIn algorithm deprioritizes them in 2025+)
- Short paragraphs: MAX 2 sentences per paragraph, blank line between each
- Use \\n\\n between paragraphs for white space
- First 2 lines MUST hook before the "See more" fold. Bold, counterintuitive claim.
- Never start with product name. Start with the problem or insight.
- End with an engagement question ("How is your team handling X?")
- 150-250 words per post
- MUST reference SPECIFIC capabilities from the actual product

FORMATS (pick 2 different from this pool, never repeat):
1. Insight then Framework then Product as Proof: Non-obvious insight, mental model, product as example.
2. Story then Lesson then Recommendation: Brief pain-point story, broader lesson, soft product mention.
3. Myth-Busting: Challenge a commonly held belief, present evidence, product as proof.
4. Numbers-First: Open with a surprising metric, explain context, reference product.
5. The Quiet Win: Describe a small overlooked improvement that compounds into a big deal.`,
    blog: `Each article must use a DIFFERENT structure from this pool:
1. PAS (Problem-Agitate-Solve): Open with the pain point, amplify the pain with consequences, present the product as the solution with specific features.
2. How-To Guide: Practical step-by-step walkthrough using the product. Include code snippets where relevant.
3. Comparison / Before-After: Show a workflow before and after adopting the product. Concrete metrics.
4. Listicle with Depth: "5 Ways [Product] Changes How You [Task]". Each item goes deep with examples.
5. The Deep Dive: Pick one feature and explore it thoroughly. How it works, why, and real-world impact.

All articles must:
- Be minimum 500 words
- Include practical examples and code snippets where relevant
- Reference actual features from the product
- Use headers and scannable formatting
- NEVER open with "In today's..." or any cliche opening`,
    casestudies: `Each case study must use a DIFFERENT structure from this pool:
1. STAR (Situation-Task-Action-Result): Classic case study. Set the scene, define the challenge, show implementation with specific product features, quantify results.
2. Before/After Narrative: Chronological story. Life before, the turning point, life after. Human experience alongside metrics.
3. The Unexpected Win: Client adopted the product for one reason but discovered unexpected benefits. Lead with the surprise.

All case studies must:
- Make companies and scenarios feel authentic and plausible
- Include 3+ measurable outcomes with realistic metrics (avoid suspiciously round numbers)
- Reference actual product capabilities, not generic descriptions
- Use different industries and company sizes`,
  };
  return frameworks[contentType] || frameworks.social;
}

function buildPreferenceInstructions(preferences?: any): string {
  const personaMatrix: Record<string, Record<string, string>> = {
    professional: {
      developers: "Write as a staff engineer writing a well-regarded technical blog. Use 'you' and 'we'. Be precise but not stiff. Technical terms are fine; explain concepts through concrete examples. Confidence without arrogance.",
      business: "Write as a VP of Engineering briefing the C-suite. Lead with outcomes and metrics. Keep technical details minimal but accurate. Let the numbers speak.",
      startups: "Write as a seasoned startup advisor who's seen what works. Direct, no-nonsense. Emphasis on speed-to-market and competitive advantage.",
      enterprise: "Write as a principal consultant preparing an executive brief. Formal but not stuffy. Prioritize risk mitigation, compliance, and scalability.",
      general: "Write as a tech journalist explaining a product to a curious reader. Clear, accessible prose. No jargon without explanation.",
    },
    casual: {
      developers: "Write as a senior dev on their personal blog after discovering something cool. Use 'I' and 'you'. Contractions always. Intensity like 'absurdly fast' or 'genuinely wild' is encouraged. Sentence fragments are fine.",
      business: "Write as a friendly CTO explaining tech to a non-technical co-founder over coffee. Warm, approachable. Analogies over acronyms.",
      startups: "Write as a founder sharing a genuine win in a Slack community. Excited but real. Short paragraphs, punchy language.",
      enterprise: "Write as a pragmatic team lead making a case to management in a relaxed all-hands. Personable but substantive.",
      general: "Write as a friend recommending an app over text. Simple words, short sentences. Genuine enthusiasm.",
    },
    technical: {
      developers: "Write as a core contributor writing detailed technical docs with personality. Precise terminology, code examples. Assume the reader knows their terminal.",
      business: "Write as a solutions architect presenting to technical stakeholders. Bridge implementation detail and business impact.",
      startups: "Write as a technical co-founder explaining the stack to potential hires. Show depth and craft.",
      enterprise: "Write as a senior systems engineer writing an internal RFC. Thorough, well-structured. Address scalability and security upfront.",
      general: "Write as a patient tech educator. Use analogies freely. Build understanding step by step.",
    },
    playful: {
      developers: "Write as a developer advocate who genuinely loves their job. Witty, energetic, occasionally irreverent. Make technical content fun without sacrificing accuracy.",
      business: "Write as a charismatic keynote speaker. Bold claims backed by substance. Memorable one-liners mixed with real insight.",
      startups: "Write as the most entertaining person in a startup accelerator. High energy, bold takes, memorable phrasing.",
      enterprise: "Write as a thought leader who brings levity to serious topics. Professional but with personality. Smart humor.",
      general: "Write as a popular science communicator who makes everything fascinating. Curiosity-driven, vivid language.",
    },
    enterprise: {
      developers: "Write as a distinguished engineer at a Fortune 500 company. Technical authority with institutional gravitas. Emphasis on reliability and standards.",
      business: "Write as a management consulting partner. Formal, structured, data-driven. No exclamation marks. Every claim backed by metrics.",
      startups: "Write as a venture partner evaluating a technology investment. Analytical, forward-looking. Balance innovation with risk.",
      enterprise: "Write as a CTO addressing the board. Maximum formality and precision. Focus on governance, compliance, and strategic alignment.",
      general: "Write as a corporate communications lead. Polished, authoritative, clear. Accessible while maintaining credibility.",
    },
  };

  const tone = preferences?.tone || 'professional';
  const audience = preferences?.audience || 'developers';
  const persona = personaMatrix[tone]?.[audience] || personaMatrix.professional.developers;

  const voiceMap: Record<string, string> = {
    formal: 'Lean toward structured, measured prose. Avoid contractions in long-form content.',
    friendly: 'Keep a warm, human tone throughout. Use contractions. Address the reader directly.',
    authoritative: 'Project deep expertise. Make definitive statements rather than hedging.',
    innovative: 'Emphasize what is new and different. Forward-looking language.',
  };

  const voice = preferences?.voice ? voiceMap[preferences.voice] || voiceMap.friendly : voiceMap.friendly;

  return `=== YOUR WRITING PERSONA ===
${persona}

${voice}

Apply this persona consistently across ALL generated content.
`;
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
      : contentType === 'social' ? 'Generate 5 posts (3 X posts, 2 LinkedIn). Use "X" as the platform name, NOT "Twitter".'
      : contentType === 'blog' ? 'Generate 3 articles with different angles.'
      : 'Generate 3 case studies with different industries.';

    const systemPrompt = `You are an expert content marketer. Generate fresh ${contentTypeLabel[contentType] || 'content'} for a product.

${prefInstructions}

=== BANNED WORDS AND PHRASES ===

These words are overused by AI and instantly flag content as machine-generated. NEVER use them.

BANNED WORDS: leverage, harness, streamline, robust, cutting-edge, seamlessly, utilize, empower, elevate, foster, spearhead, groundbreaking, revolutionary, comprehensive, holistic, synergy, paradigm, delve, realm, landscape (metaphorical), navigate (metaphorical), unlock, supercharge, turbocharge, pivotal, myriad, plethora, moreover, furthermore, hence, thus, transformative, next-level, game-changing, best-in-class, world-class, state-of-the-art, mission-critical, end-to-end, turnkey, bleeding-edge

BANNED OPENINGS: "In today's...", "In the ever-evolving...", "In a world where...", "Whether you're a... or a...", "Are you tired of...", "Let's face it...", "It's no secret that...", "When it comes to..."

BANNED PATTERNS: Three-adjective lists ("fast, reliable, and scalable"), rhetorical questions answered immediately, "Not just X, but Y" constructions, starting consecutive paragraphs the same way.

If you catch yourself using any of these, rewrite using plain, specific language.

=== WRITING LIKE A HUMAN ===

SENTENCE RHYTHM: Vary length deliberately. Long sentence, then short. Fragments are fine. One word works. Then breathe.

SPECIFICITY: "Cuts deploy time from 4 minutes to 90 seconds" beats "Dramatically accelerates deployment." Always choose the concrete detail.

MILD IMPERFECTIONS: Real people use contractions, start sentences with "And" or "But", use parenthetical asides. Don't be grammatically perfect everywhere. Be natural.

OPINIONS: Don't hedge. Don't say "can help." Say "does." Weak hedging is the hallmark of AI text.

UNIQUE PHRASING: Avoid the first phrase that comes to mind. It is probably a cliche. Describe the specific change instead of reaching for buzzwords.

=== MARKETING FRAMEWORK ===
${frameworkInstructions}

=== QUALITY SCORING ===
For each item, provide quality scores (1-10):
- Relevance: How accurately it reflects the product's actual capabilities
- Engagement: How compelling and shareable it is
- Clarity: How easy it is for the audience to understand
- Humanness: How natural and human the writing sounds. 1 = obvious AI, 10 = indistinguishable from human. Target: 7+. Score below 5 if any banned words or patterns are present.

=== RULES ===
- Base ALL content ONLY on the product summary provided. NO invented features
- ${countInstruction}
- Make each piece distinct from the others, using different angles, hooks, and focus areas
- NEVER use em dashes (the long dash character "\u2014"). Use periods, commas, colons, or semicolons instead.
- NEVER use any word or phrase from the BANNED list above.
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
        max_tokens: 12000,
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
