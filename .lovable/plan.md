
## Fix: Generate Only What the Tier Allows (Save AI Credits + Fix Counts)

### Problem

Two related issues:

1. **Wasted AI credits**: The edge function always asks the AI to generate the maximum content (5 social posts, 2 blog articles, 3 case studies) regardless of the user's tier. It then truncates/locks the excess items. For a free user, this means 80% of generated content is thrown away.

2. **Misleading counts on Dashboard**: The scan card shows "5 posts, 2 articles, 3 studies" because all items (including locked ones) are stored and counted. A free-tier user sees numbers that don't match what they can actually access.

### Solution

**Part 1 -- Edge Function (`analyze-repo/index.ts`): Tier-aware generation**

Instead of hardcoding "Generate exactly 5 social posts, 2 blog articles, 3 case studies" in the AI prompt, dynamically set these numbers based on the user's tier:

| Tier | Social Posts | Blog Articles | Case Studies |
|------|-------------|---------------|-------------|
| Free | 1 | 1 | 1 |
| Starter | 3 | 2 | 2 |
| Pro | 5 | 2 | 3 |

This means the AI only generates what the user is entitled to, saving significant token costs. The content gating code (lines 1021-1053) becomes a safety net rather than the primary mechanism.

Update the prompt lines that currently say:
- "Generate exactly 5 social posts: 3 X posts and 2 LinkedIn posts" -> dynamic based on tier
- "Generate exactly 2 blog articles" -> dynamic
- "Generate exactly 3 case studies" -> dynamic

For free tier with 1 social post, it will be 1 X post. For starter with 3, it will be 2 X + 1 LinkedIn. Pro stays at 3 X + 2 LinkedIn.

**Part 2 -- Dashboard card (`MyScans.tsx`): Filter locked items from counts**

Update the scan card to only count unlocked items. Items with `locked: true` should be excluded from the displayed counts, so the numbers match what the user can actually use.

### Technical Details

**`supabase/functions/analyze-repo/index.ts` changes:**
- After determining `userTier` (around line 694), compute content counts:
  ```
  const contentCounts = {
    social: userTier === 'pro' ? 5 : userTier === 'starter' ? 3 : 1,
    blog: userTier === 'pro' ? 2 : userTier === 'starter' ? 2 : 1,
    caseStudy: userTier === 'pro' ? 3 : userTier === 'starter' ? 2 : 1,
  };
  ```
- Replace the hardcoded counts in the generation prompt (lines 935-937) with dynamic values using these counts
- Adjust the X/LinkedIn split for social posts based on the total count
- The content gating block (lines 1021-1053) can remain as a safety fallback but will rarely trigger since the AI now only generates the right amount

**`src/pages/MyScans.tsx` changes:**
- Update the count logic to filter out locked items:
  ```
  const posts = scan.content?.socialPosts?.filter(p => !p.locked)?.length ?? 0;
  const articles = scan.content?.blogArticles?.filter(a => !a.locked)?.length ?? 0;
  const cases = scan.content?.caseStudies?.filter(c => !c.locked)?.length ?? 0;
  ```

This ensures consistency: the user sees the same number of items they can actually access, and the AI only generates what's needed.
