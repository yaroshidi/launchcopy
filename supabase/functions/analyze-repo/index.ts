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

// ── Token validation helper ─────────────────────────────

async function validateGitHubToken(githubToken: string): Promise<{ valid: boolean; user?: string; scopes?: string }> {
  try {
    const res = await fetch('https://api.github.com/user', { headers: ghHeaders(githubToken) });
    if (res.ok) {
      const user = await res.json();
      const scopes = res.headers.get('x-oauth-scopes') || '';
      return { valid: true, user: user.login, scopes };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

// ── Explicit repo access check ──────────────────────────

async function checkRepoAccess(owner: string, repo: string, githubToken: string): Promise<{ accessible: boolean; status: number; isPrivate?: boolean }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders(githubToken) });
    if (res.ok) {
      const data = await res.json();
      return { accessible: true, status: res.status, isPrivate: data.private };
    }
    console.log(`Repo access check returned status ${res.status} for ${owner}/${repo}`);
    return { accessible: false, status: res.status };
  } catch (e) {
    console.error('Repo access check error:', e);
    return { accessible: false, status: 0 };
  }
}

// ── Recursive directory scanner ─────────────────────────

interface FileEntry {
  name: string;
  path: string;
  type: string;
  download_url?: string;
}

async function fetchDirRecursive(
  owner: string,
  repo: string,
  dirPath: string,
  githubToken?: string,
  maxDepth = 3,
  currentDepth = 0,
  apiCallCount = { count: 0 },
): Promise<FileEntry[]> {
  if (currentDepth >= maxDepth || apiCallCount.count >= 15) return [];
  apiCallCount.count++;

  const items: FileEntry[] = [];
  try {
    const contents = await fetchGitHubJSON(
      `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`,
      githubToken,
    );
    if (!Array.isArray(contents)) return [];

    for (const item of contents) {
      items.push({ name: item.name, path: item.path, type: item.type, download_url: item.download_url });
      if (item.type === 'dir' && apiCallCount.count < 15) {
        const children = await fetchDirRecursive(owner, repo, item.path, githubToken, maxDepth, currentDepth + 1, apiCallCount);
        items.push(...children);
      }
    }
  } catch {
    console.log(`Could not fetch directory: ${dirPath}`);
  }
  return items;
}

// ── File priority scoring ───────────────────────────────

const SKIP_PATTERNS = /\.(test|spec|stories|story|snap|mock|fixture|d)\.(ts|tsx|js|jsx)$|\.css$|\.scss$|\.less$|\.svg$|\.png$|\.jpg$|\.ico$|\.lock$|\.map$|package-lock|yarn\.lock|bun\.lockb|node_modules|\.git\//i;

function scoreFile(filePath: string): number {
  if (SKIP_PATTERNS.test(filePath)) return -1; // skip entirely

  const lc = filePath.toLowerCase();
  const name = lc.split('/').pop() || '';

  // High priority – entry points and route definitions
  if (/^(index|main|app|server)\.(ts|tsx|js|jsx|py|rs|go)$/.test(name)) return 100;
  if (/route|router|routing/i.test(name)) return 95;
  if (/\/(pages|routes|api|handlers|controllers)\//.test(lc)) return 90;
  if (/^(config|constants)\.(ts|js|tsx|jsx)$/.test(name)) return 85;
  if (name === '.env.example' || name === '.env.local.example') return 85;

  // Medium priority – components, hooks, lib, schemas
  if (/\/(hooks|utils|lib|helpers)\//.test(lc)) return 60;
  if (/schema|models?|types|interfaces/i.test(name)) return 65;
  if (/\/(components)\//.test(lc) && !/\/ui\//.test(lc)) return 50; // skip generic UI primitives

  // Source code files get a base score
  if (/\.(ts|tsx|js|jsx|py|rs|go|java|rb|ex|exs|swift|kt)$/i.test(name)) return 30;

  return 0; // non-code files
}

// ── Deeper context gathering ────────────────────────────

async function gatherRepoContext(owner: string, repo: string, githubToken?: string): Promise<{ context: string; hasAccess: boolean; tokenInfo?: { valid: boolean; user?: string; scopes?: string }; repoAccessStatus?: number }> {
  let context = `Repository: ${owner}/${repo}\n\n`;
  let hasAccess = false;
  let tokenInfo: { valid: boolean; user?: string; scopes?: string } | undefined;
  let repoAccessStatus: number | undefined;

  // Validate token upfront if provided
  if (githubToken) {
    tokenInfo = await validateGitHubToken(githubToken);
    console.log(`Token validation: valid=${tokenInfo.valid}, user=${tokenInfo.user}, scopes="${tokenInfo.scopes}"`);

    // If token is valid, explicitly check repo access and log the status
    if (tokenInfo.valid) {
      const accessCheck = await checkRepoAccess(owner, repo, githubToken);
      repoAccessStatus = accessCheck.status;
      console.log(`Repo access check: accessible=${accessCheck.accessible}, status=${accessCheck.status}, isPrivate=${accessCheck.isPrivate}`);
    }
  }

  // 1. Repo metadata (description, topics, stars, language)
  let repoMeta: any = null;
  try {
    repoMeta = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}`, githubToken);
    if (repoMeta) {
      hasAccess = true;
      const m: RepoMeta = {
        description: repoMeta.description || '',
        topics: repoMeta.topics || [],
        stars: repoMeta.stargazers_count || 0,
        forks: repoMeta.forks_count || 0,
        language: repoMeta.language || 'Unknown',
        homepage: repoMeta.homepage || '',
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
    if (Array.isArray(rootContents)) {
      files = rootContents;
      hasAccess = true;
    }
  } catch (error) {
    console.error('Error fetching root contents:', error);
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

  // 5. Recursive directory tree + smart file reading
  const SOURCE_DIRS = ['src', 'lib', 'app', 'pages', 'routes', 'api', 'components', 'server', 'packages'];
  const dirsToScan = files
    .filter(f => f.type === 'dir' && SOURCE_DIRS.includes(f.name.toLowerCase()))
    .map(f => f.name);

  // Also include root-level source files in the tree
  let allFiles: FileEntry[] = files.map(f => ({
    name: f.name,
    path: f.path || f.name,
    type: f.type,
    download_url: f.download_url,
  }));

  // Recursively scan each key directory (up to 3 levels deep, capped at ~15 API calls)
  const apiCallCount = { count: 0 };
  for (const dir of dirsToScan) {
    if (apiCallCount.count >= 15) break;
    const dirFiles = await fetchDirRecursive(owner, repo, dir, githubToken, 3, 0, apiCallCount);
    allFiles.push(...dirFiles);
  }
  console.log(`Recursive scan found ${allFiles.length} total entries (${apiCallCount.count} API calls used)`);

  // Build the full directory tree for context
  context += "\n=== Full Directory Tree ===\n";
  const treeFiles = allFiles.slice(0, 200); // cap at 200 entries to keep context lean
  for (const f of treeFiles) {
    const depth = (f.path.match(/\//g) || []).length;
    const indent = '  '.repeat(depth);
    context += `${indent}${f.type === 'dir' ? '📁' : '📄'} ${f.path}\n`;
  }
  context += '\n';

  // 6. Smart file selection – score, sort, and read the most informative files
  const CONTEXT_BUDGET = 30000;
  let usedBudget = context.length;

  const scoredFiles = allFiles
    .filter(f => f.type === 'file' && f.download_url)
    .map(f => ({ ...f, score: scoreFile(f.path) }))
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score);

  const HIGH_PRIORITY_THRESHOLD = 80;
  const filesToRead = scoredFiles.slice(0, 15); // cap at 15 files max
  let filesRead = 0;

  for (const sf of filesToRead) {
    if (usedBudget >= CONTEXT_BUDGET) {
      console.log(`Context budget reached (${usedBudget} chars), stopping file reads after ${filesRead} files`);
      break;
    }
    const maxChars = sf.score >= HIGH_PRIORITY_THRESHOLD ? 3000 : 2000;
    try {
      const content = await fetchRawFile(sf.download_url!, githubToken);
      if (content && content.length > 10) {
        const trimmed = content.slice(0, maxChars);
        context += `\n=== Source: ${sf.path} (priority: ${sf.score}) ===\n${trimmed}\n`;
        usedBudget += trimmed.length + sf.path.length + 50;
        filesRead++;
      }
    } catch {
      console.log(`Failed to read file: ${sf.path}`);
    }
  }
  console.log(`Read ${filesRead} source files, total context: ${usedBudget} chars`);

  // 7. Latest release notes
  try {
    const release = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, githubToken);
    if (release) {
      context += `\n=== Latest Release: ${release.tag_name} ===\n${(release.body || '').slice(0, 2000)}\n`;
    }
  } catch { /* no releases */ }

  // 8. Recent commits (last 10) — shows what's actively being worked on
  try {
    const commits = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, githubToken);
    if (Array.isArray(commits) && commits.length > 0) {
      context += `\n=== Recent Commits (last ${commits.length}) ===\n`;
      for (const c of commits) {
        const date = c.commit?.author?.date ? new Date(c.commit.author.date).toISOString().split('T')[0] : 'unknown';
        const msg = (c.commit?.message || '').split('\n')[0].slice(0, 120);
        context += `[${date}] ${msg}\n`;
      }
      context += '\n';
    }
  } catch { console.log('Could not fetch recent commits'); }

  // 9. Recent merged pull requests (last 5) — shows features/fixes recently shipped
  try {
    const prs = await fetchGitHubJSON(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=5`, githubToken);
    if (Array.isArray(prs)) {
      const merged = prs.filter((pr: any) => pr.merged_at);
      if (merged.length > 0) {
        context += `=== Recently Merged PRs ===\n`;
        for (const pr of merged) {
          const date = new Date(pr.merged_at).toISOString().split('T')[0];
          context += `[${date}] #${pr.number}: ${pr.title}\n`;
          if (pr.body) context += `  ${pr.body.slice(0, 200)}\n`;
        }
        context += '\n';
      }
    }
  } catch { console.log('Could not fetch recent PRs'); }

  return { context, hasAccess, tokenInfo, repoAccessStatus };
}

// ── Tool schema (shared for generation & refinement) ────

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
  const personaMatrix: Record<string, Record<string, string>> = {
    professional: {
      developers: "Write as a staff engineer writing a well-regarded technical blog. Use 'you' and 'we'. Be precise but not stiff. Technical terms are fine; explain concepts through concrete examples, not definitions. Confidence without arrogance.",
      business: "Write as a VP of Engineering briefing the C-suite. Lead with outcomes and metrics. Keep technical details minimal but accurate. Measured confidence; let the numbers speak.",
      startups: "Write as a seasoned startup advisor who's seen what works. Direct, no-nonsense. Emphasis on speed-to-market and competitive advantage. Skip the fluff; founders are busy.",
      enterprise: "Write as a principal consultant preparing an executive brief. Formal but not stuffy. Prioritize risk mitigation, compliance, and scalability. Data-driven claims only.",
      general: "Write as a tech journalist explaining a product to a curious reader. Clear, accessible prose. No jargon without immediate explanation. Engaging but credible.",
    },
    casual: {
      developers: "Write as a senior dev on their personal blog after discovering something cool. Use 'I' and 'you'. Contractions always. Technical depth is fine but keep it conversational. Intensity like 'absurdly fast' or 'genuinely wild' is encouraged. Sentence fragments are fine.",
      business: "Write as a friendly CTO explaining tech to a non-technical co-founder over coffee. Warm, approachable. Analogies over acronyms. Make complex things feel simple without being condescending.",
      startups: "Write as a founder sharing a genuine win in a Slack community. Excited but real. Short paragraphs, punchy language. 'We shipped this in a weekend' energy.",
      enterprise: "Write as a pragmatic team lead making a case to management in a relaxed all-hands. Personable but substantive. Mix data with relatable anecdotes.",
      general: "Write as a friend recommending an app over text. Simple words, short sentences. Enthusiasm that feels genuine, not performative.",
    },
    technical: {
      developers: "Write as a core contributor writing detailed technical documentation with personality. Precise terminology, code examples where relevant. Assume the reader knows their way around a terminal. Deep-dive energy.",
      business: "Write as a solutions architect presenting to technical stakeholders. Bridge the gap between implementation detail and business impact. Include architecture-level insights.",
      startups: "Write as a technical co-founder explaining the stack to potential hires. Show depth and craft. Emphasize technical decisions and their rationale.",
      enterprise: "Write as a senior systems engineer writing an internal RFC. Thorough, detailed, well-structured. Address scalability, security, and integration concerns upfront.",
      general: "Write as a patient tech educator making complex topics accessible. Use analogies freely. Build understanding step by step without dumbing things down.",
    },
    playful: {
      developers: "Write as a developer advocate who genuinely loves their job. Witty, energetic, occasionally irreverent. Pop culture references are fine. Make technical content fun without sacrificing accuracy.",
      business: "Write as a charismatic keynote speaker who keeps the audience laughing. Bold claims backed by substance. Memorable one-liners mixed with real insight.",
      startups: "Write as the most entertaining person in a startup accelerator cohort. High energy, bold takes, memorable phrasing. 'Move fast and break conventions' vibes.",
      enterprise: "Write as a thought leader who brings levity to serious topics. Professional enough for the boardroom but with personality that stands out. Smart humor, not dad jokes.",
      general: "Write as a popular science communicator who makes everything fascinating. Curiosity-driven, vivid language. The kind of writing that makes people say 'I had no idea that was so cool.'",
    },
    enterprise: {
      developers: "Write as a distinguished engineer at a Fortune 500 company. Technical authority with institutional gravitas. Emphasis on reliability, standards, and long-term thinking.",
      business: "Write as a management consulting partner drafting a strategy document. Formal, structured, data-driven. No exclamation marks. Every claim backed by metrics or precedent.",
      startups: "Write as a venture partner evaluating a technology investment. Analytical, forward-looking. Balance innovation potential with risk assessment.",
      enterprise: "Write as a Chief Technology Officer addressing the board. Maximum formality and precision. Focus on governance, compliance, total cost of ownership, and strategic alignment.",
      general: "Write as a corporate communications lead crafting a press release with substance. Polished, authoritative, clear. Accessible to a broad audience while maintaining institutional credibility.",
    },
  };

  const tone = preferences?.tone || 'professional';
  const audience = preferences?.audience || 'developers';
  const persona = personaMatrix[tone]?.[audience] || personaMatrix.professional.developers;

  const industryMap: Record<string, string> = {
    general: '',
    saas: 'Frame all examples and scenarios in the context of SaaS products, subscription metrics (MRR, churn, LTV), and cloud-native workflows.',
    fintech: 'Frame content for financial technology: emphasize security, regulatory compliance, transaction processing, and trust.',
    healthcare: 'Frame content for healthcare tech: emphasize HIPAA compliance, patient outcomes, clinical workflows, and data sensitivity.',
    ecommerce: 'Frame content for e-commerce: emphasize conversion rates, cart optimization, inventory management, and customer experience.',
    devtools: 'Frame content for the developer tools ecosystem: emphasize DX (developer experience), integration friction, build times, and workflow automation.',
    'ai-ml': 'Frame content for AI/ML practitioners: emphasize model performance, data pipelines, inference speed, and reproducibility.',
  };

  const voiceMap: Record<string, string> = {
    formal: 'Lean toward structured, measured prose. Avoid contractions in blog articles and case studies (social posts can be more relaxed).',
    friendly: 'Keep a warm, human tone throughout. Use contractions. Address the reader directly.',
    authoritative: 'Project deep expertise. Make definitive statements rather than hedging. Back claims with specifics.',
    innovative: 'Emphasize what is new and different. Focus on unconventional approaches. Forward-looking language.',
  };

  const industry = preferences?.industry ? industryMap[preferences.industry] || '' : '';
  const voice = preferences?.voice ? voiceMap[preferences.voice] || voiceMap.friendly : voiceMap.friendly;

  return `=== YOUR WRITING PERSONA ===
${persona}

${voice}${industry ? `\n${industry}` : ''}

Apply this persona consistently across ALL generated content. Every piece should sound like it was written by this specific person.
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
    const { context: repoContext, hasAccess, tokenInfo, repoAccessStatus } = await gatherRepoContext(owner, repoName, githubToken);
    console.log(`Gathered ${repoContext.length} characters of context, hasAccess: ${hasAccess}, tokenProvided: ${!!githubToken}`);

    // ── GATE: Reject if we couldn't access repo content ──
    const MIN_CONTEXT_LENGTH = 300;
    if (!hasAccess || repoContext.length < MIN_CONTEXT_LENGTH) {
      let errorMsg: string;

      if (githubToken && tokenInfo) {
        if (!tokenInfo.valid) {
          errorMsg = 'The GitHub token you provided is invalid or expired. Please generate a new Personal Access Token (classic) with the "repo" scope and try again.';
        } else if (tokenInfo.scopes !== undefined && tokenInfo.scopes !== '' && !tokenInfo.scopes.includes('repo')) {
          // Classic token without repo scope
          errorMsg = `Your token is valid (authenticated as @${tokenInfo.user}) but is missing the "repo" scope. Please create a new Classic token with the "repo" scope enabled.`;
        } else if (tokenInfo.scopes === '' && repoAccessStatus === 404) {
          // Fine-grained PAT (empty scopes) that can't access this repo
          errorMsg = `Your token is valid (authenticated as @${tokenInfo.user}) but it appears to be a fine-grained token that does not have access to this repository. Please create a Classic Personal Access Token instead:\n\n1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)\n2. Click "Generate new token (classic)"\n3. Check the "repo" scope\n4. Generate and paste the new token here`;
        } else if (repoAccessStatus === 404) {
          // Classic token with repo scope but still 404 — user might not be a collaborator
          errorMsg = `Your token is valid (authenticated as @${tokenInfo.user}) but cannot access ${owner}/${repoName}. Please verify:\n• The repository URL is correct\n• Your GitHub account has access to this repository\n• If using a fine-grained token, switch to a Classic token with the "repo" scope`;
        } else {
          errorMsg = `Your token is valid (authenticated as @${tokenInfo.user}) but something went wrong accessing ${owner}/${repoName} (HTTP ${repoAccessStatus || 'unknown'}). Please try again or use a different token.`;
        }
      } else if (!hasAccess) {
        errorMsg = 'Could not access this repository. It may be private — please provide a GitHub Personal Access Token using the "Private repo" option below the input.';
      } else {
        errorMsg = 'Could not gather enough information from this repository to generate meaningful content. The repository may be empty or have restricted access.';
      }

      console.error(`Context gate failed: hasAccess=${hasAccess}, contextLength=${repoContext.length}, tokenProvided=${!!githubToken}, tokenValid=${tokenInfo?.valid}, repoAccessStatus=${repoAccessStatus}`);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prefInstructions = buildPreferenceInstructions(preferences);

    // ── STEP 2: Pass 1 – Generate content with marketing frameworks ──
    const generationPrompt = `You are an expert product analyst and content marketer.

IMPORTANT: You MUST return your result by calling the provided tool and passing arguments that match the required schema.

${prefInstructions}

=== CRITICAL: PRODUCT-FIRST APPROACH ===

Before generating ANY content, you MUST deeply analyze the repository data provided below and extract:
1. The EXACT product name
2. What it SPECIFICALLY does (not vague — cite actual functionality from the code/README)
3. Its specific technical capabilities and differentiators
4. Who specifically benefits and HOW

Every single piece of content you generate MUST:
- Reference the product BY NAME
- Mention at least ONE specific feature or capability found in the repository data
- Describe a CONCRETE benefit tied to what the code actually does
- NEVER be generic enough to apply to any random product — if you removed the product name and the content could apply to anything, it FAILS

If the README says "fast build tool" — say WHAT makes it fast. If it has a CLI, reference specific commands. If it supports plugins, mention the plugin system. Be SPECIFIC.

=== BANNED WORDS AND PHRASES ===

These words and phrases are overused by AI and instantly flag content as machine-generated. NEVER use them.

BANNED WORDS: leverage, harness, streamline, robust, cutting-edge, seamlessly, utilize, empower, elevate, foster, spearhead, groundbreaking, revolutionary, comprehensive, holistic, synergy, paradigm, delve, realm, landscape (when used metaphorically), navigate (when used metaphorically), unlock, supercharge, turbocharge, pivotal, myriad, plethora, moreover, furthermore, hence, thus, transformative, next-level, game-changing, best-in-class, world-class, state-of-the-art, mission-critical, end-to-end, turnkey, bleeding-edge

BANNED OPENING PATTERNS: "In today's...", "In the ever-evolving...", "In a world where...", "Whether you're a... or a...", "Are you tired of...", "Let's face it...", "It's no secret that...", "When it comes to...", "In the fast-paced world of...", "As we all know..."

BANNED STRUCTURAL PATTERNS:
- Three-adjective lists ("fast, reliable, and scalable")
- Rhetorical questions immediately followed by their answer
- Ending with "The future is [product category]"
- "Not just X, but Y" constructions
- "From X to Y" feature lists
- Starting consecutive paragraphs the same way

If you catch yourself using any of these, stop and rewrite using plain, specific language. Say exactly what you mean in words a real person would actually choose.

=== WRITING LIKE A HUMAN ===

Your biggest risk is sounding like AI. Here is how to avoid it:

SENTENCE RHYTHM: Vary sentence length deliberately. Follow a long sentence with a short one. Use fragments. One word is fine. Then let the next sentence breathe a bit longer, carrying more detail. This creates the natural rhythm of human writing.

SPECIFICITY OVER IMPRESSIVENESS: "Cuts deploy time from 4 minutes to 90 seconds" beats "Dramatically accelerates deployment." Always choose the concrete detail.

MILD IMPERFECTIONS: Real people write "kinda", "tbh", "ngl" in tweets. They start blog sentences with "And" or "But". They use parenthetical asides (like this one). They write "it's" not "it is". Don't be grammatically perfect everywhere. Be natural.

HAVE AN OPINION: Don't hedge. Don't say "can help." Say "does." Don't say "may improve." Say "improves." Weak hedging is the hallmark of AI text.

CONCRETE SENSORY DETAILS: "The kind of bug that makes you close your laptop and go for a walk" beats "a frustrating debugging experience." Ground your writing in experiences readers recognize.

UNIQUE PHRASING: Avoid the first phrase that comes to mind. It is probably a cliche. If you are about to write "takes it to the next level," stop and describe what actually changes. If you want to say "game-changer," describe the specific change instead.

=== MARKETING FRAMEWORK INSTRUCTIONS ===

**Social Posts:**

=== X POSTS (3 posts) ===
Write like a real developer posting, NOT a brand account.

HARD RULES (violating these means the post fails):
- STRICT 280 CHARACTER LIMIT. Count carefully. Posts over 280 characters are REJECTED. Aim for 200-260 characters to stay safe.
- Use \\n line breaks between sentences. Each sentence should be on its own line. This is critical for readability on X.
- NO hashtags whatsoever (X algorithm penalizes them)
- MAX 1 emoji per post, or zero. Never start with an emoji.
- Lowercase is fine and often preferred. Skip title case.
- Never use "Introducing..." or "Excited to announce..." or any corporate phrasing
- MUST mention a SPECIFIC feature or capability from the actual repo, not generic praise

HIGH-PERFORMING X POST FORMATS (pick 3 different formats from this pool — never repeat a format in the same batch):

1. **Hot Take / Contrarian**: Bold, slightly controversial opinion referencing a SPECIFIC capability.
   Example: "unpopular opinion: most CI pipelines are over-engineered.\\nyou don't need 47 yaml files.\\n[product] does it in one command."

2. **Problem then Discovery**: Relatable frustration then solution reveal citing a SPECIFIC feature.
   Example: "spent 3 hours debugging a build issue.\\nswitched to [product], same build worked first try.\\ni'm not going back."

3. **Concrete Result**: Specific metric or before/after tied to actual capabilities.
   Example: "deploy time: 4min to 90sec.\\nzero config changes.\\n[product]'s caching is genuinely smart."

4. **The Confession**: Admit a past belief, then show how the product changed your mind.
   Example: "i used to hand-roll all my auth flows.\\n'it's not that hard,' i said.\\n3 security bugs later, i use [product]."

5. **The List**: A short list of specific things the product enables or eliminates.
   Example: "3 things i stopped doing after switching to [product]:\\n- writing migration scripts by hand\\n- debugging ORM queries\\n- dreading schema changes"

6. **The Question**: One provocative question, answered in one line.
   Example: "why are we still writing boilerplate in 2025?\\n[product] auto-generates type-safe APIs from your schema."

7. **The Before/After**: Raw comparison, no editorializing.
   Example: "before [product]: 200 lines of config.\\nafter: 12.\\nsame result."

8. **The Understatement**: Deliberately downplay something impressive.
   Example: "[product] saved us maybe 6 hours a week.\\nwhich is fine i guess.\\n(it's not fine. it's absurd.)"

TONE: Write as a peer sharing a genuine recommendation, not a marketer selling. Sound like someone who actually uses the tool and is impressed. Mild intensity ("genuinely insane", "absurdly good") is fine. Avoid superlatives that feel forced.

=== LINKEDIN POSTS (2 posts) ===
Write as a senior engineer or tech lead sharing a genuine insight, NOT a company page posting.

HARD RULES:
- NO hashtags whatsoever (LinkedIn algorithm deprioritizes posts with hashtags in 2025+)
- Short paragraphs: MAX 2 sentences per paragraph, with a blank line between each
- Use \\n\\n between paragraphs for heavy white space (critical for readability on LinkedIn)
- First 2 lines MUST hook the reader before the "See more" fold. Open with a bold, counterintuitive claim or a surprising insight.
- Never start with the product name. Start with the problem or insight.
- End with an engagement question ("How is your team handling X?" or "What's your approach to Y?")
- 150-250 words per post
- MUST reference SPECIFIC capabilities and use cases from the actual repo

HIGH-PERFORMING LINKEDIN FORMATS (pick 2 different formats from this pool — never repeat):

1. **Insight then Framework then Product as Proof**: Non-obvious industry insight, mental model, product as example.
   Structure: Hook line, Insight (2 short paragraphs), Framework/principle, Product mention with specific features, Engagement question

2. **Story then Lesson then Recommendation**: Brief personal/team story about a pain point, broader lesson, natural product recommendation.
   Structure: Hook line, Story (2-3 short paragraphs), Lesson learned, Soft product mention with specific features, Engagement question

3. **Myth-Busting**: Challenge a commonly held belief in your industry, then present evidence.
   Structure: "Most people think X. They're wrong." then Why it is wrong (2 paragraphs), What actually works (with product as example), Engagement question

4. **Numbers-First**: Open with a surprising statistic or metric, then explain what it means.
   Structure: Bold metric, Context (why this matters), How it was achieved (referencing product), Engagement question

5. **The Quiet Win**: Describe a small, overlooked improvement that compounds into a big deal.
   Structure: "Nobody talks about X." then Why X matters more than people think, How product addresses X, Engagement question

**Blog Articles (2 articles, each using a DIFFERENT structure from this pool):**

1. **PAS (Problem-Agitate-Solve)**: Open with the pain point, amplify the pain with consequences, present the product as the solution. Focus on business outcomes, not code.

2. **Comparison / Before-After**: Show a specific workflow or task before and after adopting the product. Be concrete about what changes. Include real metrics or realistic estimates.

3. **Listicle with Depth**: "5 Ways [Product] Changes How You [Specific Task]". Each item goes deep with examples and specifics, not surface-level bullet points.

4. **The Deep Dive**: Pick one core benefit and explore it thoroughly. How it impacts teams, workflows, and outcomes. Focus on the "why it matters" not the "how it works technically."

All blog articles must:
- Be approximately 800 words each (aim for 750-850 words)
- Use markdown H2 headers (## Header) to break content into 3-5 clearly titled sections
- Be written for a MARKETING audience, not a technical one. Focus on benefits, outcomes, and value, not code details or architecture
- Avoid code snippets, technical jargon, or implementation details. If referencing a technical feature, explain what it DOES for the user, not HOW it works
- Use concrete examples, customer scenarios, and business impact
- NEVER open with "In today's..." or any banned opening pattern
- Each article must use a different structure from the pool above

**Case Studies (3 case studies, each using a DIFFERENT structure and industry):**

1. **STAR (Situation-Task-Action-Result)**: Classic case study. Set the scene, define the challenge, describe the solution in business terms (what capabilities were used, what changed), quantify the results.

2. **Before/After Narrative**: Tell the story chronologically. What was life like before? What was the turning point? What does life look like now? Focus on the human experience alongside metrics.

3. **The Unexpected Win**: The client adopted the product for one reason but discovered unexpected benefits. Lead with the surprise. This creates a more authentic, less formulaic narrative.

All case studies must:
- Be MARKETING-FOCUSED: describe what the product does for the customer, NOT how it works technically
- NEVER mention specific functions, methods, class names, API endpoints, code patterns, or technical implementation details
- Talk about CAPABILITIES and OUTCOMES, not code. Example: say "automated their deployment pipeline" NOT "used the deployWithConfig() function"
- Make companies and scenarios feel authentic and plausible
- Include 3+ measurable outcomes with realistic metrics (avoid suspiciously round numbers)
- Use different industries and company sizes across the 3 studies

=== ABSOLUTE RULES ===
- Base ALL content ONLY on what the repository actually does. NO invented features
- Every piece of content must mention the product by name AND reference specific capabilities (described in plain business language, NOT technical/code terms)
- Make content accessible to non-technical readers
- Focus on benefits and outcomes, not features or implementation details
- NEVER reference specific code constructs: no function names, no class names, no file paths, no API routes, no configuration keys, no CLI flags
- Use concrete examples and scenarios grounded in the repo's actual capabilities
- For social posts, use "X" as the platform name (NOT "Twitter"). Generate exactly 5 social posts: 3 X posts and 2 LinkedIn posts.
- Generate exactly 2 blog articles, each approximately 800 words, marketing-focused with markdown H2 headers (## Header), each with a different structure from the pool above. NO code snippets or technical deep-dives.
- Generate exactly 3 case studies, each with a different structure, industry, and company size. Marketing-focused, NO code references.
- NEVER use em dashes (the long dash character "\u2014"). Use periods, commas, colons, or semicolons instead.
- NEVER use any word or phrase from the BANNED list above.`;

    console.log('Pass 1: Generating content with marketing frameworks...');
    const pass1Response = await callAI({
      model: 'google/gemini-3-flash-preview',
      tools: [buildGenerationToolSchema()],
      tool_choice: { type: 'function', function: { name: 'generate_repo_marketing' } },
      messages: [
        { role: 'system', content: generationPrompt },
        { role: 'user', content: `Here is the complete repository data. Read it carefully and extract every specific feature, capability, and detail before generating content. Your content MUST reference these specifics.\n\n${repoContext}` },
      ],
      temperature: 0.85,
      max_tokens: 16000,
    });

    const draft = extractToolArgs(pass1Response);
    if (!draft) throw new Error('Failed to parse AI generation response');
    console.log('Pass 1 complete. Starting refinement pass...');

    // ── STEP 3: Pass 2 – Refine & Score ──
    const refinementPrompt = `You are a senior content editor specializing in detecting and eliminating AI-generated writing patterns. You will receive draft marketing content generated from a GitHub repository analysis.

Your job is to:

1. DETECT AND ELIMINATE AI WRITING PATTERNS:
   - Scan every piece for these BANNED WORDS and replace ALL instances with plain, specific language: leverage, harness, streamline, robust, cutting-edge, seamlessly, utilize, empower, elevate, foster, spearhead, groundbreaking, revolutionary, comprehensive, holistic, synergy, paradigm, delve, realm, landscape (metaphorical), navigate (metaphorical), unlock, supercharge, turbocharge, pivotal, myriad, plethora, moreover, furthermore, hence, thus, transformative, next-level, game-changing, best-in-class, world-class, state-of-the-art, mission-critical, end-to-end, turnkey, bleeding-edge
   - Check for these BANNED OPENINGS and rewrite them: "In today's...", "In the ever-evolving...", "In a world where...", "Whether you're a... or a...", "Are you tired of...", "Let's face it...", "It's no secret that...", "When it comes to..."
   - Check for three-adjective lists, "Not just X, but Y" constructions, and rhetorical questions answered immediately. Rewrite them.
   - Read each piece as if reading it aloud. If it sounds like a press release or a LinkedIn influencer parody, rewrite it to sound like a real person.
   - Ensure no two pieces in the same batch start the same way, use the same structure, or hit the same beats.

2. PRESERVE HUMANITY:
   - DO NOT smooth out sentence fragments, casual language, or personality. These make writing feel human.
   - DO NOT replace contractions with full forms.
   - DO NOT add transitional phrases like "moreover" or "furthermore."
   - DO NOT make every sentence the same length. Preserve rhythm variation.
   - If a piece has genuine personality or voice, protect it. Only fix factual errors and banned language.

3. ENSURE PRODUCT SPECIFICITY:
   - Every piece MUST mention the product by name and reference SPECIFIC features from the repository.
   - If any content is generic enough to apply to any product, REWRITE it with specific details from the repo.
   - Remove any hallucinated features not supported by the repository data.
   - Replace vague praise ("powerful tool", "great solution") with concrete descriptions of what the product does.

4. PLATFORM-SPECIFIC CHECKS:
   - X posts: Would a real dev actually post this? If it reads like a brand account, rewrite as a peer recommendation. Check: line breaks present, no hashtags, max 1 emoji, under 280 chars.
   - LinkedIn: No hashtags, short paragraphs (max 2 sentences each) with blank lines, hook-first opening, ends with engagement question. Must not start with the product name.
   - Blogs: Check that each article uses a different structure. No two should feel like the same template. Ensure proper markdown H2 headers (## Header) are used to break content into sections. Content should be marketing-focused with no code snippets or overly technical language. Each article should be approximately 800 words.
   - Case studies: Each must feel like a different company in a different industry. Metrics should feel plausible, not suspiciously round numbers.

5. SCORE each piece on four dimensions (1-10 scale):
   - **Relevance** (1-10): How accurately it reflects actual repository capabilities. Generic = 1-3, specific features referenced = 7-10.
   - **Engagement** (1-10): How compelling, shareable, and attention-grabbing.
   - **Clarity** (1-10): How easy for the target audience to understand.
   - **Humanness** (1-10): How natural and human the writing sounds. 1 = obvious AI, 10 = indistinguishable from a skilled human writer. Target: 7+. Score below 5 if it uses any banned words or patterns.

IMPORTANT: NEVER use em dashes (the long dash character "\u2014"). Replace any with periods, commas, colons, or semicolons.

Return the refined content with scores by calling the provided tool.

Here is the original repository context for fact-checking. Use this to verify every claim and ensure content references REAL features:
${repoContext.slice(0, 6000)}`;

    const pass2Response = await callAI({
      model: 'google/gemini-3-flash-preview',
      tools: [buildRefinementToolSchema()],
      tool_choice: { type: 'function', function: { name: 'refine_content' } },
      messages: [
        { role: 'system', content: refinementPrompt },
        { role: 'user', content: `Please refine and score this draft content. Rewrite any content that is generic or doesn't specifically reference the product's actual features:\n\n${JSON.stringify(draft.content, null, 2)}` },
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
