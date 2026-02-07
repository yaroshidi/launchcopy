

# Landing Page Upgrade -- BabyLoveGrowth-Style Sections

Inspired by BabyLoveGrowth.ai, we'll add three new sections below the hero to better communicate value and convert visitors: a features showcase with flanking cards, a pricing section, and an FAQ.

---

## What We're Adding

### 1. Features Showcase Section (replaces current simple "See what we generate")

A 3-column layout inspired by BabyLoveGrowth's content preview page:

- **Center column**: The existing `ContentShowcase` component (tabbed social/blog/case study previews)
- **Left column**: Stacked feature cards explaining content quality (e.g., "Two-Pass AI Refinement", "Platform-Optimized Formatting", "Real Codebase Analysis")
- **Right column**: More feature cards (e.g., "Quality Scored", "Ready to Publish", "SEO-Optimized Structure")

Each feature card will have:
- A small category badge (like "AI Quality", "Content Optimization")
- A bold title
- A short description
- Glass card styling matching the existing design system

On mobile, the side columns collapse below the showcase.

### 2. Pricing Section

A clean section with gradient headline ("Invest in Quality Content" or similar) showing:

- **Free tier card**: What unauthed users get (1 free preview per content type, product summary)
- **Pro tier card** (highlighted): What signing up unlocks (all 5 social posts, 3 blogs, 3 case studies, export options, regeneration)
- Feature checklist with check icons
- CTA buttons linking to /auth

Styled with the existing glass-card aesthetic, no jarring new colors.

### 3. FAQ Section

An accordion-based FAQ section answering common questions:
- "What repos can I analyze?"
- "How does the AI generate content?"
- "Is my code stored or shared?"
- "What platforms are the social posts optimized for?"
- "Can I edit the generated content?"

Uses the existing Radix accordion component.

---

## New Files

| File | Purpose |
|------|---------|
| `src/components/FeaturesShowcase.tsx` | 3-column layout with feature cards flanking the content showcase |
| `src/components/PricingSection.tsx` | Free vs Pro pricing cards with feature lists |
| `src/components/FAQSection.tsx` | Accordion-based FAQ |

## Modified Files

| File | What changes |
|------|-------------|
| `src/pages/Index.tsx` | Import and render the three new sections below the hero |
| `src/components/Navbar.tsx` | Add "Pricing" nav link alongside "How it works" |

---

## Technical Details

### FeaturesShowcase.tsx

- Wraps the existing `ContentShowcase` in a wider `max-w-6xl` container
- Left and right columns are arrays of feature card objects rendered with `motion.div` stagger animations
- Uses `whileInView` for scroll-triggered entrance
- Responsive: `grid grid-cols-1 lg:grid-cols-[240px_1fr_240px]` so side cards stack below on mobile
- Feature cards use `glass-card` utility class with `border-border/50`

Feature card data structure:
```text
{ badge: "AI Quality", title: "Two-Pass Refinement", description: "Content is generated then refined..." }
```

### PricingSection.tsx

- Section with gradient headline text
- Two cards side by side: Free (outline border) and Pro (primary gradient border, highlighted)
- Each card has a feature list with check/x icons
- Pro card has a "Sign up free" CTA button linking to `/auth`
- Uses existing `Card`, `Button` components
- Urgency/social proof line: "Join 2,400+ developers" (matches hero stat)

### FAQSection.tsx

- Uses `@radix-ui/react-accordion` (already installed)
- 5-6 questions with answers
- Styled to match the dark glassmorphic theme
- `max-w-3xl mx-auto` for readability

### Index.tsx changes

Current order: Hero -> ContentShowcase section

New order: Hero -> FeaturesShowcase (wrapping ContentShowcase) -> PricingSection -> FAQSection

### Navbar.tsx changes

Add a "Pricing" anchor link (`href="#pricing"`) next to the existing "How it works" link.

