

# Remove Em Dashes Everywhere

Fix all hardcoded em dashes in example content and add explicit rules to all AI prompts so generated content never contains them either.

---

## Changes

### 1. Fix showcase example cards

**`src/components/showcase/TweetCard.tsx`** (line 17)
- Replace "unmatched — zero config" with "unmatched. Zero config"

**`src/components/showcase/BlogCard.tsx`** (line 18)
- Replace "infrastructure—and never looked back" with "infrastructure and never looked back"

### 2. Fix mock analysis fallback content

**`src/lib/mockAnalysis.ts`** - Replace all ~15 em dashes throughout the file:
- "adapt to their workflow—not the other way around" --> use a period or comma
- "cloud version—your choice" --> use a period
- "GitHub, Slack, Jira, you name it—in seconds" --> use a period or comma
- "started like many startups—with" --> use a colon or period
- "took just two weeks—far faster" --> use a period
- "work—the problem that sparked" --> use a period
- "patchwork of tools—Trello for tasks" --> use a colon
- "missed its deadline—damaging a key" --> use a comma
- "save our agency—it transformed it" --> use a semicolon or period

Each will be rewritten to read naturally without the em dash.

### 3. Add "no em dash" rule to AI generation prompts

**`supabase/functions/analyze-repo/index.ts`**
- Add to the `CRITICAL RULES` section of the generation prompt: "NEVER use em dashes (the long dash character). Use periods, commas, colons, or semicolons instead."
- Add the same rule to the refinement prompt so the editor pass catches any that slip through.

**`supabase/functions/regenerate-content/index.ts`**
- Add to the `RULES` section: "NEVER use em dashes (the long dash character). Use periods, commas, colons, or semicolons instead."

---

## Technical Details

### Files modified
| File | What changes |
|------|-------------|
| `src/components/showcase/TweetCard.tsx` | 1 em dash replaced |
| `src/components/showcase/BlogCard.tsx` | 1 em dash replaced |
| `src/lib/mockAnalysis.ts` | ~15 em dashes replaced with appropriate punctuation |
| `supabase/functions/analyze-repo/index.ts` | Rule added to both generation and refinement system prompts |
| `supabase/functions/regenerate-content/index.ts` | Rule added to system prompt |

### No behavior changes
All fixes are cosmetic (static text) or prompt-level (AI instruction). No logic, schema, or API changes.

