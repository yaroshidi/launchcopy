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

// ── Critic tool schema ──────────────────────────────────

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

function buildCriticToolSchema() {
  return {
    type: 'function',
    function: {
      name: 'critique_content',
      description: 'Evaluate every content piece for template patterns, genericness, AI slop, and structural repetition.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['socialPosts', 'blogArticles', 'caseStudies'],
        properties: {
          socialPosts: { type: 'array', items: critiqueItemSchema },
          blogArticles: { type: 'array', items: critiqueItemSchema },
          caseStudies: { type: 'array', items: critiqueItemSchema },
        },
      },
    },
  };
}

// ── Rewrite tool schema ─────────────────────────────────

function buildRewriteToolSchema() {
  return {
    type: 'function',
    function: {
      name: 'rewrite_flagged_content',
      description: 'Return rewritten content for flagged pieces, maintaining original format.',
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

// ── Post-generation validation ──────────────────────────

const BANNED_WORDS_REGEX = /\b(leverage|harness|streamline|robust|cutting[- ]edge|seamlessly|utilize|empower|elevate|foster|spearhead|groundbreaking|revolutionary|comprehensive|holistic|synergy|paradigm|delve|realm|landscape|navigate|unlock|supercharge|turbocharge|pivotal|myriad|plethora|moreover|furthermore|hence|thus|transformative|next[- ]level|game[- ]changing|best[- ]in[- ]class|world[- ]class|state[- ]of[- ]the[- ]art|mission[- ]critical|end[- ]to[- ]end|turnkey|bleeding[- ]edge)\b/gi;

const BANNED_OPENINGS_REGEX = /^(In today'?s|In the ever[- ]evolving|In a world where|Whether you'?re a|Are you tired of|Let'?s face it|It'?s no secret that|When it comes to)/i;

function validateAndFixContent(content: any): { content: any; hadBannedWords: boolean } {
  let hadBannedWords = false;

  function fixText(text: string): string {
    // Em dash replacement
    text = text.replace(/\u2014/g, '; ');
    // Platform name fix
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

  // Process social posts
  if (Array.isArray(content.socialPosts)) {
    content.socialPosts = content.socialPosts.map((post: any) => {
      if (typeof post.content === 'string') {
        post.content = fixText(post.content);

        // X post char limit: truncate at last sentence break before 277 chars
        if (post.platform?.toLowerCase() === 'x' && post.content.length > 280) {
          const truncated = post.content.slice(0, 277);
          const lastBreak = Math.max(
            truncated.lastIndexOf('. '),
            truncated.lastIndexOf('.\n'),
            truncated.lastIndexOf('!\n'),
            truncated.lastIndexOf('! '),
            truncated.lastIndexOf('\n')
          );
          post.content = lastBreak > 100 ? truncated.slice(0, lastBreak + 1).trim() : truncated.trim();
          capScore(post.scores, 'clarity', 6);
        }

        if (checkBanned(post.content)) {
          hadBannedWords = true;
          capScore(post.scores, 'humanness', 4);
          console.warn('Banned word detected in social post');
        }
        if (checkBannedOpening(post.content)) {
          hadBannedWords = true;
          capScore(post.scores, 'humanness', 4);
          console.warn('Banned opening detected in social post');
        }
      }
      return post;
    });
  }

  // Process blog articles
  if (Array.isArray(content.blogArticles)) {
    content.blogArticles = content.blogArticles.map((article: any) => {
      if (typeof article.content === 'string') {
        article.content = fixText(article.content);
        if (typeof article.title === 'string') article.title = fixText(article.title);

        if (checkBanned(article.content) || checkBanned(article.title || '')) {
          hadBannedWords = true;
          capScore(article.scores, 'humanness', 4);
          console.warn('Banned word detected in blog article');
        }
        if (checkBannedOpening(article.content)) {
          hadBannedWords = true;
          capScore(article.scores, 'humanness', 4);
          console.warn('Banned opening detected in blog article');
        }
      }
      return article;
    });
  }

  // Process case studies
  if (Array.isArray(content.caseStudies)) {
    content.caseStudies = content.caseStudies.map((cs: any) => {
      for (const field of ['content', 'problem', 'solution'] as const) {
        if (typeof cs[field] === 'string') {
          cs[field] = fixText(cs[field]);
        }
      }
      if (typeof cs.title === 'string') cs.title = fixText(cs.title);

      const allText = [cs.content, cs.problem, cs.solution, cs.title].filter(Boolean).join(' ');
      if (checkBanned(allText)) {
        hadBannedWords = true;
        capScore(cs.scores, 'humanness', 4);
        console.warn('Banned word detected in case study');
      }
      if (typeof cs.content === 'string' && checkBannedOpening(cs.content)) {
        hadBannedWords = true;
        capScore(cs.scores, 'humanness', 4);
        console.warn('Banned opening detected in case study');
      }
      return cs;
    });
  }

  return { content, hadBannedWords };
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
    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // ── Input validation ──
    const body = await req.json();
    const repoUrl = typeof body.repoUrl === 'string' ? body.repoUrl.trim() : '';
    const githubToken = typeof body.githubToken === 'string' ? body.githubToken : undefined;
    const preferences = body.preferences && typeof body.preferences === 'object' ? body.preferences : undefined;

    if (!repoUrl || repoUrl.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is required and must be under 500 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^https?:\/\/(www\.)?github\.com\/[^\/]+\/[^\/\s]+/.test(repoUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Server-side subscription & tier check ──
    const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Determine user's tier based on product_id
    const TIER_PRODUCTS: Record<string, string> = {
      'prod_TxaJhMVjMBaTA2': 'starter',
      'prod_TxMijV21gbwIgp': 'pro',
    };

    let userTier = 'free';
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
        if (subs.data.length > 0) {
          const productId = subs.data[0].items.data[0]?.price?.product;
          userTier = (typeof productId === 'string' && TIER_PRODUCTS[productId]) || 'pro';
        }
      }
    }

    const isPro = userTier === 'pro';
    const scanLimit = userTier === 'pro' ? Infinity : userTier === 'starter' ? 5 : 1;

    // Tier-aware content counts – only generate what the user is entitled to
    const contentCounts = {
      social: isPro ? 5 : userTier === 'starter' ? 3 : 1,
      blog: isPro ? 2 : userTier === 'starter' ? 2 : 1,
      caseStudy: isPro ? 3 : userTier === 'starter' ? 2 : 1,
    };
    // X / LinkedIn split for social posts
    const xCount = isPro ? 3 : userTier === 'starter' ? 2 : 1;
    const linkedInCount = contentCounts.social - xCount;

    if (!isPro) {
      // Check existing scan count using service role
      const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
      const { count } = await adminClient.from('analyses').select('id', { count: 'exact', head: true }).eq('user_id', userId);
      if ((count ?? 0) >= scanLimit) {
        const tierLabel = userTier === 'starter' ? 'Starter' : 'Free';
        return new Response(
          JSON.stringify({ error: `${tierLabel} accounts are limited to ${scanLimit} scan${scanLimit === 1 ? '' : 's'}. Upgrade for more scans.` }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Analyzing repository: ${repoUrl} (user: ${userId}, tier: ${userTier})`);

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
          errorMsg = 'Your token is missing the "repo" scope. Please create a new Classic token with the "repo" scope enabled.';
        } else if (tokenInfo.scopes === '' && repoAccessStatus === 404) {
          errorMsg = 'Your token does not have access to this repository. Please create a Classic Personal Access Token with the "repo" scope instead of a fine-grained token.';
        } else if (repoAccessStatus === 404) {
          errorMsg = 'Your token cannot access this repository. Please verify the URL is correct and your GitHub account has access.';
        } else {
          errorMsg = 'Something went wrong accessing this repository. Please try again or use a different token.';
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

CREATIVE PRINCIPLES (apply all of these — do NOT follow a template):
- One clear idea per post. Say one thing well, not three things weakly.
- Tension or surprise in the first line. Make the reader pause.
- Include a real, specific product detail. Name the actual feature or capability.
- Earned confidence, not hype. If you claim something is great, show why in the same post.
- Each post must open with a fundamentally different pattern. If one opens with a question, another with a statement, the third must find a third shape entirely.
- INVENT your structure. Do not follow any named format or template.

BANNED OPENING PATTERNS (if your post starts with any of these, rewrite from scratch):
- "unpopular opinion:"
- "hot take:"
- "most people think X. they're wrong."
- "before [X]: [number]. after: [number]."
- "I used to [X]. Then I [Y]."
- "N things I stopped doing..."
- "nobody talks about..."
- Any opening commonly seen in AI-generated marketing posts

TONE: Write as a peer sharing a genuine recommendation, not a marketer selling. Sound like someone who actually uses the tool and is impressed. Mild intensity ("genuinely insane", "absurdly good") is fine. Avoid superlatives that feel forced.

=== LINKEDIN POSTS (2 posts) ===
Write as a senior engineer or tech lead sharing a genuine insight, NOT a company page posting.

HARD RULES:
- NO hashtags whatsoever (LinkedIn algorithm deprioritizes posts with hashtags in 2025+)
- Short paragraphs: MAX 2 sentences per paragraph, with a blank line between each
- Use \\n\\n between paragraphs for heavy white space (critical for readability on LinkedIn)
- First 2 lines MUST hook the reader before the "See more" fold. Open with a bold, counterintuitive claim or a surprising insight.
- Never start with the product name. Start with the problem or insight.
- 150-250 words per post
- MUST reference SPECIFIC capabilities and use cases from the actual repo

CREATIVE PRINCIPLES (apply all — do NOT follow a named structure):
- Curiosity or dissonance in the first 2 lines. The reader should feel compelled to click "See more."
- Substance that earns the hook. If your opening makes a bold claim, the body must deliver proof.
- Specificity over abstraction. Name the actual capability, the actual workflow change, the actual result.
- Genuine conversation ending. If the post ends with a question, it must be one you'd actually want answered. Not all posts need to end with a question.
- Each post must use a fundamentally different shape. Invent the structure; do not pick from a menu.

BANNED PATTERNS (rewrite from scratch if detected):
- "Most people think X. They're wrong."
- "Nobody talks about X."
- Hook-Body-Body-Body-Question shape repeated across posts
- Generic engagement bait questions ("What do you think?", "Agree?")
- Any opening commonly seen in AI-generated LinkedIn posts

**Blog Articles (2 articles, each structurally distinct from the others):**

EDITORIAL PRINCIPLES (apply all — do NOT follow a named formula):
- Arguable thesis in the first paragraph. The reader should know what the article believes within the first 3 sentences.
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

All blog articles must:
- Be approximately 800 words each (aim for 750-850 words)
- Use markdown H2 headers (## Header) to break content into 3-5 clearly titled sections
- Be written for a MARKETING audience, not a technical one. Focus on benefits, outcomes, and value, not code details or architecture
- Avoid code snippets, technical jargon, or implementation details. If referencing a technical feature, explain what it DOES for the user, not HOW it works
- Use concrete examples, customer scenarios, and business impact
- NEVER open with "In today's..." or any banned opening pattern

**Case Studies (3 case studies, each structurally distinct with a different industry):**

NARRATIVE PRINCIPLES (apply all — do NOT follow a named formula):
- Textured, believable companies. Give them a specific niche, a team size, a recognizable pain. Avoid generic "fast-growing SaaS startup" descriptions.
- Earned transformation. Show the messy middle: what was hard about adoption, what didn't work at first, what the team had to learn. Instant miracles feel fake.
- Honest-feeling metrics. Use odd, specific numbers (37% not 40%, 2.3 hours not 2 hours). Round numbers signal fabrication.
- Human moments. Include at least one detail that feels like a real person said it: a frustrated quote, a surprising reaction, a moment of doubt.
- Each study must tell its story differently. One might lead with the result and work backward. Another might follow one person's experience. A third might frame it as an industry-wide challenge with this company as the example. Invent the shape; do not follow a template.

BANNED PATTERNS (rewrite from scratch if detected):
- Visible STAR (Situation-Task-Action-Result) scaffolding
- "Before" / "After" as section headers
- Identical chronological arcs across studies (all starting with "Company X was struggling...")
- Generic company descriptions that could apply to any business
- Round metrics (50%, 10x, 100% increase)

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
- For social posts, use "X" as the platform name (NOT "Twitter"). Generate exactly ${contentCounts.social} social post${contentCounts.social === 1 ? '' : 's'}: ${xCount} X post${xCount === 1 ? '' : 's'}${linkedInCount > 0 ? ` and ${linkedInCount} LinkedIn post${linkedInCount === 1 ? '' : 's'}` : ''}.
- Generate exactly ${contentCounts.blog} blog article${contentCounts.blog === 1 ? '' : 's'}, each approximately 800 words, marketing-focused with markdown H2 headers (## Header), each structurally distinct from the others. NO code snippets or technical deep-dives.
- Generate exactly ${contentCounts.caseStudy} case stud${contentCounts.caseStudy === 1 ? 'y' : 'ies'}, each with a different structure, industry, and company size. Marketing-focused, NO code references.
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

5. CROSS-CONTENT VARIETY CHECK:
   - If any two pieces share the same opening structure, hook type, or conclusion pattern, rewrite one to be distinct.
   - No two social posts should use the same rhetorical device. No two blog articles should open with a similar sentence shape.

6. STRUCTURAL TEMPLATE DETECTION:
   - Can this piece's structure be described with a named formula (PAS, STAR, Hot Take, Listicle, Before/After, Hook-Body-Question, etc.)? If yes, restructure so the formula disappears while keeping the substance.
   - X posts: check for "unpopular opinion:", "hot take:", "before/after" copy-paste patterns, "N things I stopped doing" lists. If found, rewrite the post completely with a fresh angle.
   - LinkedIn posts: check if multiple posts follow identical Hook-Body-Question shapes. If so, break at least one into a fundamentally different form (e.g., a single extended metaphor, a short narrative, or a direct argument without a closing question).
   - Blog articles: check for visible PAS structure, listicle backbones, or identical section header patterns. If found, reorganize the article around a different structural principle.
   - Case studies: check for transparent STAR scaffolding or "Before/After" section headers. If found, restructure so the narrative shape is invisible.
   - If a template pattern is detected, humanness score must be ≤4 until the piece is restructured.

7. CONCRETE DETAIL TEST:
   - For each piece, verify it contains at least one specific detail that could ONLY come from this product (a feature name, a metric, a use case).
   - If a piece could apply to any generic tool, it fails. Add a specific detail from the repo data.

7. SCORE each piece on four dimensions (1-10 scale). BE CRITICAL — most AI-generated content is a 5-6:
   - **Relevance** (1-10): How accurately it reflects actual repository capabilities. Generic = 1-3, specific features referenced = 7-10.
   - **Engagement** (1-10): How compelling, shareable, and attention-grabbing.
   - **Clarity** (1-10): How easy for the target audience to understand.
   - **Humanness** (1-10): How natural and human the writing sounds. 1 = obvious AI, 10 = indistinguishable from a skilled human writer. Target: 7+. Score below 5 if it uses any banned words or patterns.

   SCORE CALIBRATION: A score of 8+ means content indistinguishable from a top human marketer. 6 is average competent writing. Only give 9+ if it would genuinely go viral or win awards. Be honest — inflated scores help no one.

IMPORTANT: NEVER use em dashes (the long dash character "\u2014"). Replace any with periods, commas, colons, or semicolons.

Return the refined content with scores by calling the provided tool.

Here is the original repository context for fact-checking. Use this to verify every claim and ensure content references REAL features:
${repoContext.slice(0, 15000)}`;

    const MAX_REFINEMENT_RETRIES = 1;
    const HUMANNESS_THRESHOLD = 5;
    let refined: any = null;

    for (let attempt = 0; attempt <= MAX_REFINEMENT_RETRIES; attempt++) {
      const pass2Response = await callAI({
        model: 'google/gemini-3-flash-preview',
        tools: [buildRefinementToolSchema()],
        tool_choice: { type: 'function', function: { name: 'refine_content' } },
        messages: [
          { role: 'system', content: refinementPrompt },
          { role: 'user', content: `Please refine and score this draft content. Rewrite any content that is generic or doesn't specifically reference the product's actual features:\n\n${JSON.stringify(draft.content, null, 2)}` },
        ],
        temperature: 0.45,
        max_tokens: 12000,
      });

      refined = extractToolArgs(pass2Response);
      console.log(`Pass 2 (refinement) attempt ${attempt + 1} complete.`);

      if (!refined?.content) break;

      // Validate and fix content programmatically
      const validated = validateAndFixContent(refined.content);
      refined.content = validated.content;

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
    const pass2Content = refined?.content || draft.content;
    let rewrittenContent = pass2Content;

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

4. STRUCTURAL REPETITION — Do any two pieces in the same category share an opening shape, rhetorical arc, or conclusion pattern?
   If yes, mark structural_repetition = true on the LATER piece.

FAIL THRESHOLD: A piece fails if ANY of these are true:
- template_detected = true
- generic_score >= 6
- ai_slop_score >= 6
- structural_repetition = true

Critiques must be SPECIFIC and ACTIONABLE. Not "too generic" but "paragraph 2 says 'saves time' without naming the feature; replace with [specific capability from the product]."
If a piece passes, set critique to empty string.

Product context:
Name: ${draft.summary?.name || 'unknown'}
What it does: ${draft.summary?.whatItDoes || 'unknown'}
Key Features: ${draft.summary?.keyFeatures?.join(', ') || 'unknown'}

Evaluate ALL pieces and return critiques by calling the tool.`;

      console.log('Pass 3: Running critic evaluation...');
      const pass3Response = await callAI({
        model: 'google/gemini-3-flash-preview',
        tools: [buildCriticToolSchema()],
        tool_choice: { type: 'function', function: { name: 'critique_content' } },
        messages: [
          { role: 'system', content: criticPrompt },
          { role: 'user', content: `Evaluate this content:\n\n${JSON.stringify(pass2Content, null, 2)}` },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      });

      const critiques = extractToolArgs(pass3Response);

      if (critiques) {
        // Collect all flagged pieces across categories
        const flaggedSocial: number[] = [];
        const flaggedBlog: number[] = [];
        const flaggedCase: number[] = [];
        const critiqueMap: Record<string, string> = {};

        for (const item of (critiques.socialPosts || [])) {
          if (!item.pass) {
            flaggedSocial.push(item.index);
            critiqueMap[`social_${item.index}`] = item.critique;
          }
        }
        for (const item of (critiques.blogArticles || [])) {
          if (!item.pass) {
            flaggedBlog.push(item.index);
            critiqueMap[`blog_${item.index}`] = item.critique;
          }
        }
        for (const item of (critiques.caseStudies || [])) {
          if (!item.pass) {
            flaggedCase.push(item.index);
            critiqueMap[`case_${item.index}`] = item.critique;
          }
        }

        const totalFlagged = flaggedSocial.length + flaggedBlog.length + flaggedCase.length;
        console.log(`Pass 3: ${totalFlagged} pieces flagged.`);

        // ── Pass 4: Targeted rewrite ──────────────────────
        if (totalFlagged > 0) {
          console.log('Pass 4: Rewriting flagged pieces...');

          // Build payload with only flagged pieces + their critiques
          const flaggedContent: any = { socialPosts: [], blogArticles: [], caseStudies: [] };

          if (Array.isArray(pass2Content.socialPosts)) {
            flaggedContent.socialPosts = flaggedSocial.map(i => {
              const piece = pass2Content.socialPosts[i];
              return piece ? { ...piece, _critique: critiqueMap[`social_${i}`] || '' } : null;
            }).filter(Boolean);
          }
          if (Array.isArray(pass2Content.blogArticles)) {
            flaggedContent.blogArticles = flaggedBlog.map(i => {
              const piece = pass2Content.blogArticles[i];
              return piece ? { ...piece, _critique: critiqueMap[`blog_${i}`] || '' } : null;
            }).filter(Boolean);
          }
          if (Array.isArray(pass2Content.caseStudies)) {
            flaggedContent.caseStudies = flaggedCase.map(i => {
              const piece = pass2Content.caseStudies[i];
              return piece ? { ...piece, _critique: critiqueMap[`case_${i}`] || '' } : null;
            }).filter(Boolean);
          }

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
Name: ${draft.summary?.name || 'unknown'}
What it does: ${draft.summary?.whatItDoes || 'unknown'}
Key Features: ${draft.summary?.keyFeatures?.join(', ') || 'unknown'}
Value Props: ${draft.summary?.valueProps?.join(', ') || 'unknown'}

Return the rewritten pieces by calling the tool.`;

          try {
            const pass4Response = await callAI({
              model: 'google/gemini-3-flash-preview',
              tools: [buildRewriteToolSchema()],
              tool_choice: { type: 'function', function: { name: 'rewrite_flagged_content' } },
              messages: [
                { role: 'system', content: rewritePrompt },
                { role: 'user', content: `Rewrite these flagged pieces:\n\n${JSON.stringify(flaggedContent, null, 2)}` },
              ],
              temperature: 0.7,
              max_tokens: 12000,
            });

            const rewritten = extractToolArgs(pass4Response);

            if (rewritten?.content) {
              // Merge rewritten pieces back at original indices
              rewrittenContent = JSON.parse(JSON.stringify(pass2Content));

              if (Array.isArray(rewritten.content.socialPosts)) {
                rewritten.content.socialPosts.forEach((piece: any, ri: number) => {
                  const origIdx = flaggedSocial[ri];
                  if (origIdx !== undefined && rewrittenContent.socialPosts?.[origIdx]) {
                    rewrittenContent.socialPosts[origIdx] = piece;
                  }
                });
              }
              if (Array.isArray(rewritten.content.blogArticles)) {
                rewritten.content.blogArticles.forEach((piece: any, ri: number) => {
                  const origIdx = flaggedBlog[ri];
                  if (origIdx !== undefined && rewrittenContent.blogArticles?.[origIdx]) {
                    rewrittenContent.blogArticles[origIdx] = piece;
                  }
                });
              }
              if (Array.isArray(rewritten.content.caseStudies)) {
                rewritten.content.caseStudies.forEach((piece: any, ri: number) => {
                  const origIdx = flaggedCase[ri];
                  if (origIdx !== undefined && rewrittenContent.caseStudies?.[origIdx]) {
                    rewrittenContent.caseStudies[origIdx] = piece;
                  }
                });
              }

              // Run validation again on rewritten content
              const revalidated = validateAndFixContent(rewrittenContent);
              rewrittenContent = revalidated.content;
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

    function applyTemplateOpenerCheck(content: any) {
      const checkFirst = (text: string) => TEMPLATE_OPENER_REGEX.test(text.split('\n')[0].trim());
      const cap = (scores: any) => {
        if (scores && typeof scores.humanness === 'number' && scores.humanness > 4) {
          scores.humanness = 4;
        }
      };

      if (Array.isArray(content.socialPosts)) {
        for (const p of content.socialPosts) {
          if (typeof p.content === 'string' && checkFirst(p.content)) {
            cap(p.scores);
            console.warn('Template opener detected in social post (post-Pass 4)');
          }
        }
      }
      if (Array.isArray(content.blogArticles)) {
        for (const a of content.blogArticles) {
          if (typeof a.content === 'string' && checkFirst(a.content)) {
            cap(a.scores);
            console.warn('Template opener detected in blog article (post-Pass 4)');
          }
        }
      }
      if (Array.isArray(content.caseStudies)) {
        for (const c of content.caseStudies) {
          if (typeof c.content === 'string' && checkFirst(c.content)) {
            cap(c.scores);
            console.warn('Template opener detected in case study (post-Pass 4)');
          }
        }
      }
    }

    applyTemplateOpenerCheck(rewrittenContent);

    const finalContent = rewrittenContent;

    // Server-side content gating: truncate locked content based on tier
    let gatedContent = finalContent;
    if (userTier !== 'pro') {
      const truncate = (text: string, len = 80) =>
        text.length > len ? text.slice(0, len) + '...' : text;

      // Content limits per tier
      const limits = userTier === 'starter'
        ? { social: 3, blog: 2, caseStudy: 2 }
        : { social: 1, blog: 1, caseStudy: 1 };

      if (Array.isArray(gatedContent.socialPosts)) {
        gatedContent.socialPosts = gatedContent.socialPosts.map((p: any, i: number) =>
          i < limits.social ? p : { ...p, content: truncate(p.content), locked: true }
        );
      }
      if (Array.isArray(gatedContent.blogArticles)) {
        gatedContent.blogArticles = gatedContent.blogArticles.map((a: any, i: number) =>
          i < limits.blog ? a : { ...a, content: truncate(a.content), locked: true }
        );
      }
      if (Array.isArray(gatedContent.caseStudies)) {
        gatedContent.caseStudies = gatedContent.caseStudies.map((c: any, i: number) =>
          i < limits.caseStudy ? c : {
            ...c,
            content: truncate(c.content),
            problem: truncate(c.problem || '', 60),
            solution: truncate(c.solution || '', 60),
            outcomes: ['Upgrade to see outcomes'],
            locked: true,
          }
        );
      }
    }

    const result = {
      repoUrl,
      analyzedAt: new Date().toISOString(),
      refinedAt: refined ? new Date().toISOString() : undefined,
      summary: draft.summary,
      scenarios: draft.scenarios,
      content: gatedContent,
    };

    console.log('Analysis complete with refinement and scoring');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error analyzing repository:', error);
    const status = error?.status || 500;
    const safeMessages: Record<number, boolean> = { 400: true, 401: true, 403: true, 422: true, 429: true, 402: true };
    const message = safeMessages[status] ? (error?.message || 'Failed to analyze repository') : 'Failed to analyze repository';
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
