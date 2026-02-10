

# My Scans Dashboard

A new `/my-scans` page where logged-in users can see all their past repository analyses in a clean, organized layout.

## What You'll Get

- A dedicated "My Scans" page showing all your previously analyzed repos
- Each scan displayed as a card with the repo name, a brief description, scan date, and content counts (posts, articles, case studies)
- Click any scan to open it in the full content dashboard
- Delete scans you no longer need
- A "My Scans" link in the navbar and user menu for easy access
- If you're not logged in, you'll be redirected to sign in

## Layout

Each scan card will show:
- Repository name (extracted from the GitHub URL)
- Product description (from the summary)
- Date scanned
- Quick stats: number of social posts, blog articles, and case studies
- Actions: Open or Delete

---

## Technical Details

### 1. New page: `src/pages/MyScans.tsx`
- Fetches saved analyses using the existing `loadUserAnalyses` API
- Displays a grid of scan cards
- Clicking a card calls `loadAnalysisById` and navigates to the dashboard view
- Delete button calls `deleteAnalysis` with a confirmation
- Empty state for users with no scans yet
- Loading skeleton while data loads

### 2. New route in `src/App.tsx`
- Add `/my-scans` route pointing to the new page

### 3. Update `src/components/Navbar.tsx`
- Add a "My Scans" link visible only to logged-in users

### 4. Update `src/components/UserMenu.tsx`
- Add a "My Scans" menu item in the dropdown

### 5. Update `src/lib/api.ts` (`loadUserAnalyses`)
- Extend the select query to also return content counts (or the full content JSON so we can count items client-side) to display stats on each card

### 6. No database changes needed
- The `analyses` table and RLS policies already support everything required

