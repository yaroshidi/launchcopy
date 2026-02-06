

# Content Generation Pipeline Upgrade

This plan adds all the missing pieces identified in the analysis: a two-pass AI refinement pipeline, marketing frameworks, quality scoring, working regeneration buttons, deeper repo context gathering, and individual content regeneration.

---

## 1. Deeper Repository Context Gathering

Currently the edge function only reads README, package.json/manifest, and the top-level + one-level-deep directory listing. We'll expand this to pull more meaningful data.

**What changes:**
- Fetch the repo's GitHub description, topics, and star/fork counts via the GitHub API metadata endpoint (`/repos/{owner}/{repo}`)
- Read additional documentation files: `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/` folder index
- Read up to 3 key source files from `src/` or `lib/` (the first few, truncated to ~2000 chars each) to understand actual functionality
- Fetch GitHub release notes (latest release) if available

This gives the AI much richer context to work with, resulting in more accurate and grounded content.

---

## 2. Marketing Frameworks in the System Prompt

The current prompt says "generate marketing content" but doesn't use proven copywriting structures. We'll embed framework instructions directly into the system prompt:

- **Social posts**: Use the AIDA framework (Attention, Interest, Desire, Action) -- each post should hook attention, build interest in the problem solved, create desire for the solution, and end with a clear CTA
- **Blog articles**: Use the PAS framework (Problem, Agitate, Solution) -- open with the pain point, amplify why it matters, then present the repo as the answer
- **Case studies**: Use the STAR framework (Situation, Task, Action, Result) -- structure each narrative around a concrete scenario with measurable outcomes

These are added as explicit instructions per content type in the system prompt, not as separate AI calls.

---

## 3. Two-Pass Content Refinement

After the initial generation, a second AI call reviews and improves the draft content. This is the biggest quality upgrade.

**How it works:**
- Pass 1 (existing): Generate all content as today
- Pass 2 (new): Send the generated content back to the AI with a "content editor" system prompt that:
  - Checks for hallucinated features not present in the repo
  - Improves weak hooks and CTAs
  - Ensures platform-appropriate formatting (tweet length, LinkedIn tone)
  - Tightens prose and removes filler
  - Returns the refined version in the same structured format

The refinement call uses the same tool-call schema so the output is guaranteed to be valid JSON. The edge function handles both passes sequentially before returning.

---

## 4. Content Quality Scoring

Each piece of generated content gets a quality score from the refinement pass. The AI rates each item on three dimensions:

- **Relevance** (1-10): How accurately it reflects the actual repo capabilities
- **Engagement** (1-10): How compelling and shareable the content is
- **Clarity** (1-10): How easy it is for the target audience to understand

Scores are returned alongside the content and displayed as small badges on each content card in the dashboard.

---

## 5. Working Regeneration Buttons

The "Regenerate All" buttons in each tab currently fake it with a 1.5-second timeout. We'll make them actually call the AI.

**New edge function: `regenerate-content`**
- Accepts the existing analysis summary + repo URL + preferences + which content type to regenerate (social, blog, or casestudies)
- Runs a focused AI call that only regenerates the requested content type, using the existing summary as context (no need to re-fetch the repo)
- Returns just the regenerated content section
- Also runs the refinement + scoring pass on the new content

**Frontend changes:**
- `ContentTabs` gets an `onRegenerate` callback prop
- `Dashboard` passes a handler that calls the new edge function and merges the result into the existing analysis state
- Individual `ContentCard` components also get a regenerate button (visible on hover alongside edit/copy) for single-item regeneration
- The new edge function also supports regenerating a single item by index

---

## 6. Updated Types

Add quality scores to the type definitions:

- `SocialPost`, `BlogArticle`, and `CaseStudy` each get an optional `scores` field: `{ relevance: number; engagement: number; clarity: number }`
- `RepoAnalysis` gets an optional `refinedAt` timestamp to indicate the content has been through the refinement pass

---

## Technical Details

### File: `supabase/functions/analyze-repo/index.ts`
- Expand `gatherRepoContext()`:
  - Add a call to `https://api.github.com/repos/{owner}/{repo}` for description, topics, stars, language
  - Fetch `CONTRIBUTING.md`, `CHANGELOG.md` if they exist (truncated)
  - Read up to 3 source files from the `src/` directory
  - Fetch latest release from `https://api.github.com/repos/{owner}/{repo}/releases/latest`
- Update the system prompt to include AIDA/PAS/STAR framework instructions per content type
- After the first AI call, make a second AI call with a "content editor" prompt that refines the output and adds quality scores
- Update the tool schema to include optional `scores` on each content item
- Increase `max_tokens` to 12000 to accommodate the richer output

### File: `supabase/functions/regenerate-content/index.ts` (new)
- New edge function that accepts `{ repoUrl, summary, preferences, contentType, itemIndex? }`
- Calls the AI with focused prompts for the specific content type
- Runs the refinement pass
- Returns the regenerated content with scores
- Handles 429/402 errors properly

### File: `supabase/config.toml`
- Add the new `regenerate-content` function entry

### File: `src/types/analysis.ts`
- Add `ContentScores` interface: `{ relevance: number; engagement: number; clarity: number }`
- Add optional `scores?: ContentScores` to `SocialPost`, `BlogArticle`, `CaseStudy`
- Add optional `refinedAt?: Date` to `RepoAnalysis`

### File: `src/lib/api.ts`
- Add `regenerateContent()` function that calls the new edge function
- Add type for the regeneration request/response

### File: `src/components/ContentTabs.tsx`
- Replace the fake `handleRegenerate` with a real one that calls `regenerateContent()`
- Accept `analysis` as mutable state (via callback) so regenerated content updates the UI
- Add loading states per tab during regeneration
- Show toast on success/failure

### File: `src/components/ContentCard.tsx`
- Add a "Regenerate" button (refresh icon) in the hover action bar
- Display quality scores as small colored badges (green/yellow/red based on score) below the metadata
- Accept an `onRegenerate` callback prop
- Show a spinner during individual regeneration

### File: `src/components/Dashboard.tsx`
- Manage analysis state with `useState` so regenerated content can be merged in
- Pass regeneration handlers down to `ContentTabs`

### File: `src/pages/Index.tsx`
- Update state management to support mutable analysis data after regeneration

