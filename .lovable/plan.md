

# UI Improvements Plan

## 1. Clickable Logo (Navbar)
Make the "LaunchCopy" text in `src/components/Navbar.tsx` a `<Link to="/">` so it always navigates home.

## 2. Pricing Plan Text Update (PricingSection)
In `src/components/PricingSection.tsx`, update the Pro features list:
- Change "5 social posts (3 X + 2 LinkedIn)" to "Unlimited social posts"
- Change "3 blog articles" to "Unlimited blog articles"
- Change "3 case studies" to "Unlimited case studies"

## 3. RepoInput Layout Changes
In `src/components/RepoInput.tsx`:
- Remove the fallback text "Paste any public GitHub repository URL to get started" (line 239)
- Move the "Private repo" toggle button to appear directly below the Analyze button (after the main input bar), instead of in the centered controls section
- Keep the token help text when the token field is visible

## 4. Navbar: Conditional Links for Logged-In Users
In `src/components/Navbar.tsx`:
- When user IS logged in: hide "How it works" and "Pricing" links; show only "Dashboard" (linking to `/my-scans`)
- When user is NOT logged in: show "How it works", "Pricing", and "Sign In" as today
- Remove the separate "My Scans" link (replaced by "Dashboard")

## 5. Dashboard Page Enhancement
In `src/pages/MyScans.tsx`:
- Rename the page title from "My Scans" to "Dashboard"
- Add a "New Scan" button in the header area that navigates to `/` (the home page with the input form)
- Keep all existing scan list, delete, and open functionality

## Technical Details

**Navbar.tsx changes:**
- Wrap logo `<span>` in `<Link to="/">`
- Conditionally render nav links based on `user` state
- Replace "My Scans" with "Dashboard"

**PricingSection.tsx changes:**
- Update 3 strings in `PRO_FEATURES` array

**RepoInput.tsx changes:**
- Remove the paragraph with "Paste any public GitHub..." text
- Restructure the "Private repo" button to sit below the main input bar but above the preference chips

**MyScans.tsx changes:**
- Update heading text to "Dashboard"
- Add a "New Scan" button next to the heading
