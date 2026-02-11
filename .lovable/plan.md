
# Production Readiness Checklist for LaunchCopy

Here is a comprehensive checklist of what needs to be done before shipping to real users. Items are grouped by priority.

---

## CRITICAL -- Must Fix Before Launch

### 1. Fix Analyses INSERT Policy (Database)
The security scan found that users currently **cannot create new analyses** because there's a RESTRICTIVE INSERT policy but no PERMISSIVE one. This means the core feature (saving scans) is broken for logged-in users.

**Action:** Add a permissive INSERT policy:
```text
CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2. Add Missing UPDATE Policy on Analyses Table
Users cannot update their own analyses (e.g., when content is refined). Add an UPDATE policy.

**Action:** Add UPDATE policy with `USING (auth.uid() = user_id)` and `WITH CHECK (auth.uid() = user_id)`.

### 3. Enable Leaked Password Protection
The auth system currently allows users to sign up with passwords known to be in data breaches. This is a one-setting change.

**Action:** Enable leaked password protection via auth configuration.

### 4. Move GitHub Token from localStorage to sessionStorage
GitHub personal access tokens are stored in `localStorage`, which persists across sessions and is vulnerable to XSS and malicious extensions. Switching to `sessionStorage` limits exposure to the current tab.

**Action:** Replace all `localStorage.getItem/setItem("github_token")` calls with `sessionStorage` equivalents in `RepoInput.tsx` and `PrivateRepoDialog.tsx`.

---

## HIGH -- Should Fix Before Launch

### 5. Replace Placeholder OG Image
The `index.html` uses a generic Lovable placeholder image for OpenGraph/Twitter cards (`lovable.dev/opengraph-image-p98pqg.png`). This is what users see when someone shares a LaunchCopy link on social media.

**Action:** Create a branded OG image (1200x630px) and update the `og:image` and `twitter:image` meta tags. Also update `twitter:site` from `@Lovable` to your own handle.

### 6. Update the GitHub Link in Navbar
The navbar has a GitHub icon linking to `https://github.com` (the homepage), not to the LaunchCopy repo or anything meaningful.

**Action:** Either link it to the actual LaunchCopy repo, or remove the icon if there's no public repo to link to.

### 7. Sanitize Error Messages in Edge Functions
Several edge functions return verbose internal details (Stripe errors, GitHub API specifics, AI gateway errors) directly to the client. This leaks implementation details.

**Action:** In each edge function's catch block, log the full error server-side and return only a generic user-facing message.

### 8. Add a Terms of Service and Privacy Policy Page
Required for any production SaaS, especially one that processes payments via Stripe and handles user data.

**Action:** Create `/terms` and `/privacy` routes with appropriate legal content, and link them from the footer/auth page.

---

## MEDIUM -- Polish Before Launch

### 9. Add a Proper 404 Page
The current 404 page is unstyled (white background) and doesn't match the app's dark glassmorphic theme.

**Action:** Restyle `NotFound.tsx` to match the app's design system with a "Return home" button.

### 10. Add Loading / Error Boundaries
There are no React error boundaries. If a component crashes, users see a white screen.

**Action:** Add a top-level `ErrorBoundary` component wrapping the app routes with a friendly "Something went wrong" fallback.

### 11. Remove Console Logs from Production
API calls (`api.ts`) and edge functions contain `console.log` statements that leak info in the browser console and server logs.

**Action:** Remove or guard `console.log` calls in client code. Keep server-side logging but remove sensitive data from log output.

### 12. Add `robots.txt` Sitemap Reference
The robots.txt allows all crawlers but doesn't reference a sitemap.

**Action:** Add a sitemap.xml (even a simple one with just `/`) and reference it in robots.txt.

---

## LOW -- Nice to Have

### 13. Add Favicon Verification
Verify the `favicon.png` is a proper branded icon and not a placeholder.

### 14. Add Page Titles per Route
Currently only the index page has a proper title. The `/auth`, `/my-scans`, and `/404` routes don't set document titles.

**Action:** Use a simple `useEffect` or a `<Helmet>`-style approach to set `document.title` per page.

### 15. Stripe Webhook for Subscription Status
Currently, subscription status is polled every 60 seconds from the client. For production reliability, add a Stripe webhook endpoint that updates a `subscriptions` table on events like `customer.subscription.updated` and `customer.subscription.deleted`.

---

## Summary Table

| # | Item | Priority | Effort |
|---|------|----------|--------|
| 1 | Fix INSERT policy on analyses | Critical | 5 min |
| 2 | Add UPDATE policy on analyses | Critical | 5 min |
| 3 | Enable leaked password protection | Critical | 2 min |
| 4 | GitHub token to sessionStorage | Critical | 10 min |
| 5 | Replace OG image and Twitter meta | High | 15 min |
| 6 | Fix/remove navbar GitHub link | High | 5 min |
| 7 | Sanitize edge function errors | High | 30 min |
| 8 | Terms of Service / Privacy Policy | High | 30 min+ |
| 9 | Style the 404 page | Medium | 15 min |
| 10 | Add error boundary | Medium | 15 min |
| 11 | Remove console.log in client code | Medium | 15 min |
| 12 | Add sitemap.xml | Medium | 10 min |
| 13 | Verify favicon | Low | 5 min |
| 14 | Per-route page titles | Low | 10 min |
| 15 | Stripe webhook for subscriptions | Low | 1 hr |

Would you like me to start working through these items? I'd recommend tackling the Critical items first (items 1-4), then moving to High priority.
