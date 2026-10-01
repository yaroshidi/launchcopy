# LaunchCopy Rebuild: Full Redesign and Overhaul

Every part of the app gets rebuilt: look, scan quality, reliability, and plans. The work happens in phases so each one can be checked before the next starts. Accounts, saved scans, and Stripe subscribers stay as they are.

## Design direction (locked)
- **Palette, Brutalist Pop:** white `#ffffff`, ink `#0a0a0a`, orange `#ff5722`, yellow `#ffeb3b`. This replaces the mint green.
- **Type:** Syne for headings (big, tight), Plus Jakarta Sans for body text.
- **Layout:** broken grid with overlapping blocks, off-grid cards, thick 2–3px ink borders, hard offset shadows (no blur), square corners, and loud orange/yellow highlight blocks.
- **Motion:** one staggered load-in on the home page, snappy hover moves (cards shift onto their shadow). No soft glows or gradients.

## Phase 1: Design directions
Take screenshots of the current home page and generate 3 rendered directions with the locked palette, type, and layout. You pick one before any build work starts.

## Phase 2: Visual rebuild (every page)
- New design tokens and fonts across the whole site. Light theme by default, with a matching ink-dark version.
- Rebuild: home page (hero, features, pricing, FAQ, footer), navbar and profile menu, sign-in page, scan-in-progress screen, results screen (summary, social, blog, and case study cards, export), My Scans and trash, profile page, plans popup, upgrade popup, locked-content overlay, and the privacy and terms pages.
- Mobile layouts get their own composition instead of a stacked desktop layout.

## Phase 3: Scan quality
- Review the repo-analysis prompts and pick the best current AI model for them.
- Better repo reading: README, package files, key source files, and recent commits feed a structured product summary.
- More specific output: a distinct voice for each platform (X, LinkedIn), blog posts with real structure, and case studies tied to actual features. Stricter output checks so cards never render half-empty.
- Regenerate (Pro) uses the same improved prompts.

## Phase 4: Reliability and speed
- Split the very large analysis function into smaller shared modules.
- Show scan progress as it streams in, so results appear in steps instead of after one long wait.
- Enforce scan limits on the server, not only in the browser (right now they can be bypassed).
- Clean up duplicate access rules on saved scans, add consistent error messages, and remove temporary admin functions and the hardcoded free-plan email override (move it to a proper "complimentary plan" record).

## Phase 5: Plans and billing
- Keep the current rules: Free gets 1 scan with preview content, Starter ($10) gets 1 full scan per day, Pro ($40) gets unlimited scans plus regenerate.
- Map every live Stripe product correctly, including the unmapped `prod_TcCjAlQ1MyrQPG`.
- One shared plans and upgrade popup, used everywhere (menu, profile, locked content, regenerate), with a promo code field for both plans.
- The profile page shows usage (scans left today) next to the plan details.

## Open questions (to settle along the way)
- Which plan is `prod_TcCjAlQ1MyrQPG`? Starter or Pro.
- Should prices or plan limits change, or stay as they are?

## Technical details
- Tokens in `src/index.css` and `tailwind.config.ts` (HSL), with fonts loaded in `index.html`. The `rounded` and `shadow` utilities get redefined for the brutalist style.
- Edge functions: break `analyze-repo` (about 78k chars) into `_shared/` modules (github fetch, summarize, generate, validate). Default to the Lovable AI Gateway.
- New `complimentary_plans` table (user_id, tier, expires_at) with GRANTs and RLS, read by `check-subscription`. `analyze-repo` checks the `scan_logs` count on the server and inserts the log itself.
- Remove the duplicate INSERT policy on `analyses`. Remove `admin-create-subscription`.
- Update the memory note for the color/brand change. Record the architecture rules in `AGENTS.md`.
