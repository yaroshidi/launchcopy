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

CREATIVE PRINCIPLES (apply all — do NOT follow a template):
- One clear idea per post. Say one thing well, not three things weakly.
- Tension or surprise in the first line. Make the reader pause.
- Include a real, specific product detail. Name the actual feature or capability.
- Earned confidence, not hype. If you claim something is great, show why in the same post.
- Each post must open with a fundamentally different pattern. No two posts may share an opening shape.
- INVENT your structure. Do not follow any named format or template.

BANNED OPENING PATTERNS (rewrite from scratch if your post starts with any of these):
- "unpopular opinion:" / "hot take:"
- "most people think X. they're wrong."
- "before [X]: [number]. after: [number]."
- "I used to [X]. Then I [Y]."
- "N things I stopped doing..."
- "nobody talks about..."
- Any opening commonly seen in AI-generated marketing posts

TONE: Write as a peer sharing a genuine recommendation. Mild intensity ("genuinely insane", "absurdly good") is fine.

=== LINKEDIN POSTS ===
Write as a senior engineer sharing a genuine insight, NOT a company page.

HARD RULES:
- NO hashtags (LinkedIn algorithm deprioritizes them in 2025+)
- Short paragraphs: MAX 2 sentences per paragraph, blank line between each
- Use \\n\\n between paragraphs for white space
- First 2 lines MUST hook before the "See more" fold. Bold, counterintuitive claim.
- Never start with product name. Start with the problem or insight.
- 150-250 words per post
- MUST reference SPECIFIC capabilities from the actual product

CREATIVE PRINCIPLES (apply all — do NOT follow a named structure):
- Curiosity or dissonance in the first 2 lines. Compel the reader to click "See more."
- Substance that earns the hook. Bold claims need proof in the body.
- Specificity over abstraction. Name the actual capability, workflow change, or result.
- Genuine conversation ending. Not all posts need a question. If one ends with a question, it must be one you'd actually want answered.
- Each post must use a fundamentally different shape. Invent the structure; do not pick from a menu.

BANNED PATTERNS (rewrite from scratch if detected):
- "Most people think X. They're wrong."
- "Nobody talks about X."
- Hook-Body-Body-Body-Question shape repeated across posts
- Generic engagement bait questions ("What do you think?", "Agree?")
- Any opening commonly seen in AI-generated LinkedIn posts`,
    blog: `Each article must be structurally distinct from the others.

EDITORIAL PRINCIPLES (apply all — do NOT follow a named formula):
- Arguable thesis in the first paragraph. The reader should know what the article believes within 3 sentences.
- Recognizable scenarios. Ground the article in situations the reader has actually experienced.
- Progressive depth. Start accessible, reward readers who keep going with increasingly specific insight.
- Reframing ending. The conclusion should make the reader see the problem differently, not just summarize.
- Each article must use a different organizational principle. Invent the structure; do not pick from a menu.

BANNED PATTERNS (rewrite from scratch if detected):
- Visible PAS (Problem-Agitate-Solve) structure
- "5 Ways..." / "N Things..." / any numbered listicle format as the article's backbone
- Broad industry statement openings ("In today's fast-paced...", "The modern developer...")
- CTA-style endings ("Ready to get started?", "Try [product] today!")
- Same section headers appearing across multiple articles

All articles must:
- Be approximately 800 words each (aim for 750-850 words)
- Use markdown H2 headers (## Header) to break content into 3-5 clearly titled sections
- Be written for a MARKETING audience, not a technical one. Focus on benefits, outcomes, and value, not code details or architecture
- Avoid code snippets, technical jargon, or implementation details. If referencing a technical feature, explain what it DOES for the user, not HOW it works
- Use concrete examples, customer scenarios, and business impact
- NEVER open with "In today's..." or any banned opening pattern`,
    casestudies: `Each case study must be structurally distinct with a different industry.

NARRATIVE PRINCIPLES (apply all — do NOT follow a named formula):
- Textured, believable companies. Specific niche, team size, recognizable pain. No generic "fast-growing SaaS startup" descriptions.
- Earned transformation. Show the messy middle: what was hard, what didn't work at first. Instant miracles feel fake.
- Honest-feeling metrics. Use odd, specific numbers (37% not 40%, 2.3 hours not 2 hours). Round numbers signal fabrication.
- Human moments. Include at least one detail that feels like a real person said it.
- Each study tells its story differently. Invent the shape; do not follow a template.

BANNED PATTERNS (rewrite from scratch if detected):
- Visible STAR (Situation-Task-Action-Result) scaffolding
- "Before" / "After" as section headers
- Identical chronological arcs across studies
- Generic company descriptions that could apply to any business
- Round metrics (50%, 10x, 100% increase)

All case studies must:
- Be MARKETING-FOCUSED: describe what the product does for the customer, NOT how it works technically
- NEVER mention specific functions, methods, class names, API endpoints, code patterns, or technical implementation details
- Talk about CAPABILITIES and OUTCOMES, not code. Example: say "automated their deployment pipeline" NOT "used the deployWithConfig() function"
- Make companies and scenarios feel authentic and plausible
- Include 3+ measurable outcomes with realistic metrics (avoid suspiciously round numbers)
- Use different industries and company sizes`,
  };
  return frameworks[contentType] || frameworks.social;
}

// ── AI call helpers ──────────────────────────────────────

async function callRegenAI(body: Record<string, unknown>): Promise<any> {
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

function extractRegenToolArgs(aiResponse: any): any | null {
  const msg = aiResponse.choices?.[0]?.message;
  const toolArgs = msg?.tool_calls?.[0]?.function?.arguments ?? (msg as any)?.function_call?.arguments;
  if (toolArgs) {
    try {
      return JSON.parse(typeof toolArgs === 'string' ? toolArgs : JSON.stringify(toolArgs));
    } catch { /* fall through */ }
  }
  const content = msg?.content;
  if (content) {
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      return JSON.parse(jsonMatch[1].trim());
    } catch { /* fall through */ }
  }
  return null;
}

// ── Post-generation validation ──────────────────────────

const BANNED_WORDS_REGEX = /\b(leverage|harness|streamline|robust|cutting[- ]edge|seamlessly|utilize|empower|elevate|foster|spearhead|groundbreaking|revolutionary|comprehensive|holistic|synergy|paradigm|delve|realm|landscape|navigate|unlock|supercharge|turbocharge|pivotal|myriad|plethora|moreover|furthermore|hence|thus|transformative|next[- ]level|game[- ]changing|best[- ]in[- ]class|world[- ]class|state[- ]of[- ]the[- ]art|mission[- ]critical|end[- ]to[- ]end|turnkey|bleeding[- ]edge)\b/gi;

const BANNED_OPENINGS_REGEX = /^(In today'?s|In the ever[- ]evolving|In a world where|Whether you'?re a|Are you tired of|Let'?s face it|It'?s no secret that|When it comes to)/i;

function validateAndFixRegenContent(items: any[], contentType: string): { items: any[]; hadBannedWords: boolean } {
  let hadBannedWords = false;

  function fixText(text: string): string {
    text = text.replace(/\u2014/g, '; ');
    text = text.replace(/\bTwitter\b/g, 'X');
    return text;
  }

  function checkBanned(text: string): boolean {
    return BANNED_WORDS_REGEX.test(text);
  }

  function checkBannedOpening(text: string): boolean {
    const firstLine = text.split('\n')[0].trim();
    return BANNED_OPENINGS_REGEX.test(firstLine);
  }

  function capScore(scores: any, field: string, max: number) {
    if (scores && typeof scores[field] === 'number' && scores[field] > max) {
      scores[field] = max;
    }
  }

  items = items.map((item: any) => {
    if (typeof item.content === 'string') {
      item.content = fixText(item.content);

      // X post char limit
      if (contentType === 'social' && item.platform?.toLowerCase() === 'x' && item.content.length > 280) {
        const truncated = item.content.slice(0, 277);
        const lastBreak = Math.max(
          truncated.lastIndexOf('. '),
          truncated.lastIndexOf('.\n'),
          truncated.lastIndexOf('!\n'),
          truncated.lastIndexOf('! '),
          truncated.lastIndexOf('\n')
        );
        item.content = lastBreak > 100 ? truncated.slice(0, lastBreak + 1).trim() : truncated.trim();
        capScore(item.scores, 'clarity', 6);
      }

      const allText = [item.content, item.title, item.problem, item.solution].filter(Boolean).join(' ');
      if (checkBanned(allText)) {
        hadBannedWords = true;
        capScore(item.scores, 'humanness', 4);
        console.warn(`Banned word detected in ${contentType} item`);
      }
      if (checkBannedOpening(item.content)) {
        hadBannedWords = true;
        capScore(item.scores, 'humanness', 4);
        console.warn(`Banned opening detected in ${contentType} item`);
      }
    }

    // Fix text in other fields
    for (const field of ['title', 'problem', 'solution'] as const) {
      if (typeof item[field] === 'string') {
        item[field] = fixText(item[field]);
      }
    }

    return item;
  });

  return { items, hadBannedWords };
}

// ── Refinement tool schema for regeneration ─────────────

function buildRefinementToolSchemaForRegen(contentType: string) {
  return {
    type: 'function',
    function: {
      name: 'refine_regen_content',
      description: `Refine and score regenerated ${contentType} content.`,
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['items'],
        properties: {
          items: buildRegenerationToolSchema(contentType).function.parameters.properties.items,
        },
      },
    },
  };
}

// ── Critic tool schema for regeneration ──────────────────

const critiqueItemSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['index', 'pass', 'template_detected', 'template_name', 'generic_score', 'ai_slop_score', 'structural_repetition', 'critique'],
  properties: {
    index: { type: 'number' },
    pass: { type: 'boolean' },
    template_detected: { type: 'boolean' },
    template_name: { type: 'string' },
    generic_score: { type: 'number' },
    ai_slop_score: { type: 'number' },
    structural_repetition: { type: 'boolean' },
    critique: { type: 'string' },
  },
};

function buildCriticToolSchemaForRegen(contentType: string) {
  return {
    type: 'function',
    function: {
      name: 'critique_regen_content',
      description: `Evaluate each ${contentType} piece for template patterns, genericness, AI slop, and structural repetition.`,
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['critiques'],
        properties: {
          critiques: { type: 'array', items: critiqueItemSchema },
        },
      },
    },
  };
}

// ── Rewrite tool schema for regeneration ─────────────────

function buildRewriteToolSchemaForRegen(contentType: string) {
  return {
    type: 'function',
    function: {
      name: 'rewrite_flagged_regen_content',
      description: `Return rewritten ${contentType} content for flagged pieces.`,
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['items'],
        properties: {
          items: buildRegenerationToolSchema(contentType).function.parameters.properties.items,
        },
      },
    },
  };
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
    // ── Auth check ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userEmail = claimsData.claims.email as string;

    // ── Input validation ──
    const body = await req.json();
    const repoUrl = typeof body.repoUrl === 'string' ? body.repoUrl.trim() : '';
    const summary = body.summary && typeof body.summary === 'object' ? body.summary : null;
    const preferences = body.preferences && typeof body.preferences === 'object' ? body.preferences : undefined;
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const itemIndex = typeof body.itemIndex === 'number' ? body.itemIndex : undefined;

    const validContentTypes = ['social', 'blog', 'casestudies'];
    if (!contentType || !validContentTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'contentType must be one of: social, blog, casestudies' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!summary || !summary.name || !summary.whatItDoes) {
      return new Response(
        JSON.stringify({ error: 'summary with name and whatItDoes is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Server-side subscription check ──
    const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    let isPro = false;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
        isPro = subs.data.length > 0;
      }
    }

    if (!isPro) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required for content regeneration.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('Server configuration error');

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

    // ── Pass 1: Creative generation ──
    console.log('Pass 1: Generating content...');
    const pass1Response = await callRegenAI({
      model: 'google/gemini-3-flash-preview',
      tools: [buildRegenerationToolSchema(contentType)],
      tool_choice: { type: 'function', function: { name: 'regenerate_content' } },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 12000,
    });

    const draft = extractRegenToolArgs(pass1Response);
    if (!draft?.items) {
      throw new Error('Failed to parse regeneration response');
    }
    console.log(`Pass 1 complete. Generated ${draft.items.length} items.`);

    // ── Pass 2: Refinement + scoring ──
    const productContext = `Product: ${summary.name}\nWhat it does: ${summary.whatItDoes}\nKey Features: ${summary.keyFeatures?.join(', ')}\nValue Props: ${summary.valueProps?.join(', ')}`;

    const refinementPrompt = `You are a senior content editor specializing in detecting and eliminating AI-generated writing patterns. You will receive draft ${contentTypeLabel[contentType] || 'content'} to refine.

Your job is to:

1. DETECT AND ELIMINATE AI WRITING PATTERNS:
   - Scan every piece for BANNED WORDS and replace ALL instances: leverage, harness, streamline, robust, cutting-edge, seamlessly, utilize, empower, elevate, foster, spearhead, groundbreaking, revolutionary, comprehensive, holistic, synergy, paradigm, delve, realm, landscape (metaphorical), navigate (metaphorical), unlock, supercharge, turbocharge, pivotal, myriad, plethora, moreover, furthermore, hence, thus, transformative, next-level, game-changing, best-in-class, world-class, state-of-the-art, mission-critical, end-to-end, turnkey, bleeding-edge
   - Check for BANNED OPENINGS: "In today's...", "In the ever-evolving...", "In a world where...", "Whether you're a... or a...", "Are you tired of...", "Let's face it...", "It's no secret that...", "When it comes to..."
   - Check for three-adjective lists, "Not just X, but Y" constructions, and rhetorical questions answered immediately.

2. PRESERVE HUMANITY:
   - DO NOT smooth out sentence fragments, casual language, or personality.
   - DO NOT replace contractions with full forms.
   - Preserve rhythm variation. If a piece has genuine voice, protect it.

3. ENSURE PRODUCT SPECIFICITY:
   - Every piece MUST reference SPECIFIC features from the product.
   - If any content is generic enough to apply to any product, REWRITE it with specific details.
   - Replace vague praise with concrete descriptions of what the product does.

4. CROSS-CONTENT VARIETY CHECK:
   - If any two pieces share the same opening structure, hook type, or conclusion pattern, rewrite one to be distinct.

5. STRUCTURAL TEMPLATE DETECTION:
   - Can this piece's structure be described with a named formula (PAS, STAR, Hot Take, Listicle, Before/After, Hook-Body-Question, etc.)? If yes, restructure so the formula disappears while keeping the substance.
   - X posts: check for "unpopular opinion:", "hot take:", "before/after" copy-paste patterns. If found, rewrite completely.
   - LinkedIn posts: check if posts follow identical Hook-Body-Question shapes. If so, break at least one into a different form.
   - Blog articles: check for visible PAS structure, listicle backbones, or identical section headers. If found, reorganize.
   - Case studies: check for transparent STAR scaffolding or "Before/After" section headers. If found, restructure.
   - If a template pattern is detected, humanness score must be ≤4 until the piece is restructured.

6. CONCRETE DETAIL TEST:
   - For each piece, verify it contains at least one specific detail that could ONLY come from this product.
   - If a piece could apply to any generic tool, add a specific detail from the product data.

6. SCORE each piece (1-10). BE CRITICAL — most AI content is a 5-6:
   - Relevance: Generic = 1-3, specific features referenced = 7-10.
   - Engagement: How compelling and shareable.
   - Clarity: How easy to understand.
   - Humanness: 1 = obvious AI, 10 = indistinguishable from human. Score below 5 if banned words present.

   SCORE CALIBRATION: 8+ means indistinguishable from a top human marketer. Only 9+ if it would genuinely go viral.

IMPORTANT: NEVER use em dashes ("\u2014"). Replace with periods, commas, colons, or semicolons.

Product context for fact-checking:
${productContext}

Return the refined content with scores by calling the provided tool.`;

    const MAX_REFINEMENT_RETRIES = 1;
    let finalItems = draft.items;

    for (let attempt = 0; attempt <= MAX_REFINEMENT_RETRIES; attempt++) {
      console.log(`Pass 2: Refinement attempt ${attempt + 1}...`);
      try {
        const pass2Response = await callRegenAI({
          model: 'google/gemini-3-flash-preview',
          tools: [buildRefinementToolSchemaForRegen(contentType)],
          tool_choice: { type: 'function', function: { name: 'refine_regen_content' } },
          messages: [
            { role: 'system', content: refinementPrompt },
            { role: 'user', content: `Please refine and score this draft content:\n\n${JSON.stringify(draft.items, null, 2)}` },
          ],
          temperature: 0.45,
          max_tokens: 12000,
        });

        const refined = extractRegenToolArgs(pass2Response);
        if (refined?.items) {
          finalItems = refined.items;
        }
      } catch (e) {
        console.warn('Refinement pass failed, using draft:', e);
        break;
      }

      // Validate and fix
      const validated = validateAndFixRegenContent(finalItems, contentType);
      finalItems = validated.items;

      if (!validated.hadBannedWords) {
        console.log('Validation passed: no banned words detected.');
        break;
      }

      console.warn(`Validation: banned words detected after refinement attempt ${attempt + 1}.`);
      if (attempt < MAX_REFINEMENT_RETRIES) {
        console.log('Retrying refinement...');
      }
    }

    // ── Pass 3: Critic ──────────────────────────────────
    try {
      const criticPrompt = `You are a ruthless content quality critic. You have NOT seen this content before. Evaluate every piece independently on 4 dimensions.

For each piece, assess:

1. TEMPLATE PATTERN DETECTION — Does the piece follow a recognizable formula?
   Known templates: PAS (Problem-Agitate-Solve), STAR (Situation-Task-Action-Result), listicle, hot take, before/after, hook-body-question, AIDA (Attention-Interest-Desire-Action).
   If the structure maps to any named formula, template_detected = true and name it.

2. GENERICNESS — Substitution test: replace the product name with "Acme Tool". If the piece still reads plausibly, it is too generic.
   1 = deeply specific to this exact product, 10 = could describe any product.

3. AI SLOP — Check for: banned buzzwords (leverage, streamline, robust, cutting-edge, etc.), predictable rhythm, three-adjective lists, hedging language ("can help", "may improve"), superlative stacking, suspiciously round metrics (50%, 10x, 100%).
   1 = indistinguishable from human, 10 = obviously AI-generated.

4. STRUCTURAL REPETITION — Do any two pieces share an opening shape, rhetorical arc, or conclusion pattern?
   If yes, mark structural_repetition = true on the LATER piece.

FAIL THRESHOLD: A piece fails if ANY of these are true:
- template_detected = true
- generic_score >= 6
- ai_slop_score >= 6
- structural_repetition = true

Critiques must be SPECIFIC and ACTIONABLE. Not "too generic" but "paragraph 2 says 'saves time' without naming the feature; replace with [specific capability from the product]."
If a piece passes, set critique to empty string.

Product context:
Name: ${summary.name}
What it does: ${summary.whatItDoes}
Key Features: ${summary.keyFeatures?.join(', ') || 'unknown'}

Evaluate ALL pieces and return critiques by calling the tool.`;

      console.log('Pass 3: Running critic evaluation...');
      const pass3Response = await callRegenAI({
        model: 'google/gemini-3-flash-preview',
        tools: [buildCriticToolSchemaForRegen(contentType)],
        tool_choice: { type: 'function', function: { name: 'critique_regen_content' } },
        messages: [
          { role: 'system', content: criticPrompt },
          { role: 'user', content: `Evaluate this content:\n\n${JSON.stringify(finalItems, null, 2)}` },
        ],
        temperature: 0.3,
        max_tokens: 6000,
      });

      const critResult = extractRegenToolArgs(pass3Response);

      if (critResult?.critiques) {
        const flaggedIndices: number[] = [];
        const critiqueMap: Record<number, string> = {};

        for (const item of critResult.critiques) {
          if (!item.pass) {
            flaggedIndices.push(item.index);
            critiqueMap[item.index] = item.critique;
          }
        }

        console.log(`Pass 3: ${flaggedIndices.length} pieces flagged.`);

        // ── Pass 4: Targeted rewrite ──────────────────────
        if (flaggedIndices.length > 0) {
          console.log('Pass 4: Rewriting flagged pieces...');

          const flaggedItems = flaggedIndices.map(i => {
            const piece = finalItems[i];
            return piece ? { ...piece, _critique: critiqueMap[i] || '' } : null;
          }).filter(Boolean);

          const rewritePrompt = `You are a senior rewriter. You receive content pieces that failed quality review, each with a _critique field explaining what is wrong.

Your job:
1. Address EVERY point in the critique. Do not ignore any feedback.
2. Do NOT replace one template with another. Invent a fresh structure.
3. Maintain all format rules (character limits for X posts, markdown headers for blogs, etc.).
4. Keep the same product details but express them differently.
5. Remove the _critique field from your output.
6. Re-score each piece honestly.

NEVER use em dashes ("\u2014"). NEVER use banned words (leverage, harness, streamline, robust, cutting-edge, seamlessly, etc.).

Product context:
Name: ${summary.name}
What it does: ${summary.whatItDoes}
Key Features: ${summary.keyFeatures?.join(', ') || 'unknown'}
Value Props: ${summary.valueProps?.join(', ') || 'unknown'}

Return the rewritten pieces by calling the tool.`;

          try {
            const pass4Response = await callRegenAI({
              model: 'google/gemini-3-flash-preview',
              tools: [buildRewriteToolSchemaForRegen(contentType)],
              tool_choice: { type: 'function', function: { name: 'rewrite_flagged_regen_content' } },
              messages: [
                { role: 'system', content: rewritePrompt },
                { role: 'user', content: `Rewrite these flagged pieces:\n\n${JSON.stringify(flaggedItems, null, 2)}` },
              ],
              temperature: 0.7,
              max_tokens: 12000,
            });

            const rewritten = extractRegenToolArgs(pass4Response);

            if (rewritten?.items && Array.isArray(rewritten.items)) {
              // Merge rewritten pieces back at original indices
              rewritten.items.forEach((piece: any, ri: number) => {
                const origIdx = flaggedIndices[ri];
                if (origIdx !== undefined && finalItems[origIdx]) {
                  finalItems[origIdx] = piece;
                }
              });

              // Run validation again
              const revalidated = validateAndFixRegenContent(finalItems, contentType);
              finalItems = revalidated.items;
              console.log('Pass 4: Rewrite complete, validation applied.');
            }
          } catch (e) {
            console.warn('Pass 4 rewrite failed, keeping Pass 2 output:', e);
          }
        }
      }
    } catch (e) {
      console.warn('Pass 3 critic failed, keeping Pass 2 output:', e);
    }

    // ── Template opener regex fallback ────────────────────
    const TEMPLATE_OPENER_REGEX = /^(unpopular opinion|hot take|most people think|before .*:.*after|nobody talks about|\d+ things)/i;
    for (const item of finalItems) {
      if (typeof item.content === 'string') {
        const firstLine = item.content.split('\n')[0].trim();
        if (TEMPLATE_OPENER_REGEX.test(firstLine)) {
          if (item.scores && typeof item.scores.humanness === 'number' && item.scores.humanness > 4) {
            item.scores.humanness = 4;
          }
          console.warn('Template opener detected (post-Pass 4)');
        }
      }
    }

    console.log(`Regeneration complete. ${finalItems.length} items.`);

    return new Response(
      JSON.stringify({ items: finalItems, contentType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error regenerating content:', error);
    const status = error?.status || 500;
    return new Response(
      JSON.stringify({ error: status === 500 ? 'Failed to regenerate content' : (error?.message || 'Failed to regenerate content') }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
