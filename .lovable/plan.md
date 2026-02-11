

# Fix: Server-Side Content Gating

## Problem
The backend returns ALL generated content to every user. For free users, the frontend only applies CSS blur to hide items beyond the first one per category, but the full text remains in the HTML DOM. Anyone can open browser DevTools and read everything.

## Solution
Truncate locked content **server-side** before it reaches the browser, so free users only receive the first item per category in full. Remaining items get their content stripped and replaced with a placeholder.

## Changes

### 1. Backend: `supabase/functions/analyze-repo/index.ts`
After the final `result` object is built (around line 1008), add content truncation for non-Pro users:

- If `isPro` is false, iterate over `socialPosts`, `blogArticles`, and `caseStudies`
- Keep the first item in each array intact
- For all subsequent items, replace `content` with a short truncated preview (first 80 characters + "...") and add a `locked: true` flag
- For case studies, also redact `problem`, `solution`, and `outcomes` fields

This ensures the actual content never leaves the server.

### 2. Frontend: `src/components/ContentCard.tsx`
- Instead of rendering the full content with CSS blur when `locked` is true, show a placeholder message like "Upgrade to Pro to view this content"
- Remove the `blur-sm select-none pointer-events-none` CSS approach entirely for locked cards
- Display only the title/platform and scores (which serve as teasers), but no body text

### 3. Frontend: `src/components/ContentTabs.tsx`
- No structural changes needed; the existing `locked={!isUnlocked && index > 0}` logic remains correct since it aligns with the server-side truncation at index > 0

## Technical Details

**Server-side truncation logic (analyze-repo):**
```text
if (!isPro) {
  for each category (socialPosts, blogArticles, caseStudies):
    keep items[0] as-is
    for items[1+]:
      replace content with first ~80 chars + "..."
      set locked = true
      (for case studies: also truncate problem/solution/outcomes)
```

**ContentCard change:**
```text
When locked === true:
  - Show title, platform icon, scores as normal
  - Replace CardContent body with a static "Content locked" message
  - Remove blur-based CSS hiding
```

This ensures content is never sent to the client, making inspection useless.

