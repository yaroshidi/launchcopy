

# Freemium Funnel: Move Auth Behind Analysis

This changes the user flow from "login first, then use the tool" to "use the tool freely, see a preview, then login and pay to unlock everything."

---

## New User Flow

1. **Landing page** is fully public -- no login required to visit or use it
2. User pastes a GitHub URL and clicks **Analyze** -- the analysis runs without authentication
3. After analysis completes, the **Dashboard** appears showing:
   - The full **Product Summary** (left column) -- always visible
   - **One content card per tab** shown in full (the "free preview")
   - **Remaining content cards blurred/locked** with an overlay prompting the user to sign up and subscribe
4. Locked content shows a glass overlay with a "Sign up to unlock all content" CTA
5. Clicking the CTA takes the user to the `/auth` page (or opens a sign-in modal)
6. After signing in, content remains locked until they have an active subscription (Phase 2 with Stripe -- not in this change)

---

## What Changes

### 1. Remove Route Protection from `/`

**File: `src/App.tsx`**
- Remove the `ProtectedRoute` wrapper around the `Index` page
- The home page becomes fully public
- Keep the `/auth` route for when users choose to sign in
- Keep `AuthProvider` so we can still detect logged-in users

### 2. Make Navbar Auth-Aware but Not Blocking

**File: `src/components/Navbar.tsx`**
- If the user is logged in: show the `UserMenu` (avatar + sign out) as it does now
- If the user is NOT logged in: show a "Sign In" link/button that goes to `/auth`
- Either way, the page is accessible

### 3. Add Locked State to ContentTabs

**File: `src/components/ContentTabs.tsx`**
- Accept a new `isUnlocked` boolean prop
- When `isUnlocked` is `false`:
  - Show only the **first** content card in each tab normally
  - Show all remaining cards in a blurred/locked state
  - Disable "Regenerate All" button
- When `isUnlocked` is `true`: show everything as it does today

### 4. Create a LockedContentOverlay Component

**New file: `src/components/LockedContentOverlay.tsx`**
- A glassmorphic overlay that sits on top of blurred content
- Shows a lock icon, headline like "Unlock all generated content"
- Brief value proposition (e.g., "Sign up to access all social posts, blog articles, and case studies")
- Primary CTA button: "Sign up to unlock" (links to `/auth`)
- If user is logged in but not subscribed: button says "Upgrade to unlock" (for Phase 2 Stripe integration)

### 5. Update ContentCard for Locked State

**File: `src/components/ContentCard.tsx`**
- Accept an optional `locked` boolean prop
- When `locked` is `true`:
  - Apply a CSS blur filter to the card content
  - Disable all interactive buttons (edit, copy, regenerate)
  - Add `pointer-events-none` and `select-none` to prevent text selection
  - The card is still rendered (so users can see there IS more content) but it's unreadable

### 6. Pass Auth State to Dashboard

**File: `src/components/Dashboard.tsx`**
- Read `useAuth()` to check if user is logged in
- For now: `isUnlocked = !!user` (logged in = unlocked; Phase 2 will add subscription check)
- Pass `isUnlocked` down to `ContentTabs`
- Disable the Export button when content is locked

### 7. Update Index Page

**File: `src/pages/Index.tsx`**
- No changes needed -- it already allows analysis without auth since we're removing the route protection

---

## Technical Details

### `src/App.tsx`
- Remove `ProtectedRoute` component entirely (or keep it for future use but don't wrap Index)
- Change the `/` route from `<ProtectedRoute><Index /></ProtectedRoute>` to just `<Index />`

### `src/components/Navbar.tsx`
- Add a conditional: if no `user`, render a `<Link to="/auth">` styled as a small button saying "Sign In"

### `src/components/LockedContentOverlay.tsx` (new)
- Uses `useAuth` to check user state
- If not logged in: "Sign up to unlock" button linking to `/auth`
- If logged in (but later, not subscribed): "Upgrade to unlock" button
- Styled with `backdrop-blur`, gradient border, centered content

### `src/components/ContentCard.tsx`
- Add `locked?: boolean` prop
- When locked: wrap content in a div with `blur-sm opacity-60 pointer-events-none select-none`
- Hide the hover action buttons entirely when locked

### `src/components/ContentTabs.tsx`
- Add `isUnlocked: boolean` prop
- For each tab's content list: render `items[0]` normally, then for `items.slice(1)` pass `locked={!isUnlocked}` to `ContentCard`
- After the locked cards, render `<LockedContentOverlay />` if `!isUnlocked`
- Disable "Regenerate All" button when `!isUnlocked`

### `src/components/Dashboard.tsx`
- Import `useAuth` and check `const { user } = useAuth()`
- Pass `isUnlocked={!!user}` to `ContentTabs`
- Conditionally disable `ExportMenu` when not unlocked

### `src/pages/Auth.tsx`
- No changes needed (already handles redirect to `/` after login)

