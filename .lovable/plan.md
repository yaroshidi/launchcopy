

# Home Page Design Transformation

## The Problem
The current layout follows the overused "centered hero" pattern: badge at top, big heading, subtitle, centered input box, pill tags, scroll indicator. This is the default template look that thousands of SaaS landing pages use.

## The New Design Direction: "Command Center" Layout

Instead of a generic centered hero, we'll create an asymmetric, editorial-style layout that feels like a modern creative tool -- not another cookie-cutter SaaS page.

### Design Concept

```text
+--------------------------------------------------------------+
| [Logo/Brand]                            [GitHub] [Theme]     |
+--------------------------------------------------------------+
|                        |                                      |
|  SMALL CAPS LABEL      |   +------------------------------+  |
|                        |   |                              |  |
|  Transform any         |   |   [Animated preview of       |  |
|  GitHub repo into      |   |    generated content --      |  |
|  marketing             |   |    fake tweets, blog         |  |
|  gold.                 |   |    snippets, cards cycling   |  |
|                        |   |    through with animation]   |  |
|  One line description  |   |                              |  |
|                        |   +------------------------------+  |
|  +------------------+  |                                      |
|  | github.com/...   |  |   Social Posts  Blog  Case Studies  |
|  +------ [Go] ------+  |   ~~~~~~~~~~~~                      |
|                        |   "Ship faster with our CLI..."     |
|  [Customize v]         |   "10 features developers love..."  |
|  [Private repo?]       |   "How Acme scaled with..."         |
|                        |                                      |
|  Trusted by devs at    |                                      |
|  [logo] [logo] [logo]  |                                      |
+--------------------------------------------------------------+
```

### Key Design Changes

**1. Split-screen asymmetric layout (instead of centered stack)**
- Left side: Headline, input, and controls -- all left-aligned
- Right side: Animated live preview showing example generated content cycling through

**2. Animated content showcase (replaces static pills)**
- A mock "preview card" on the right shows example outputs rotating through:
  - A fake tweet card
  - A blog article preview
  - A case study snippet
- Content types fade/slide between each other every 4 seconds
- This actually demonstrates what the tool does, rather than just listing it

**3. Minimal top navigation bar**
- Small brand name top-left
- GitHub link and optional theme toggle top-right
- Clean, professional feel

**4. Left-aligned typography with more personality**
- Large, bold headline left-aligned (not centered)
- Smaller, tighter subtitle
- The input sits naturally below the text, not floating in the middle

**5. Remove overused elements**
- No sparkle badge
- No scroll indicator mouse animation
- No gradient blur orbs in background
- No feature pill tags
- Replace with a subtle dot grid or noise texture background

**6. New background treatment**
- Subtle noise/grain texture overlay instead of blur orbs
- Faint geometric accent line or border treatment
- Clean and editorial, not "glassmorphism"

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/Hero.tsx` | **Rewrite** | New split-screen layout with left content + right animated preview |
| `src/components/ContentShowcase.tsx` | **Create** | Animated cycling preview of example outputs (tweets, blogs, case studies) |
| `src/components/Navbar.tsx` | **Create** | Minimal top navigation bar |
| `src/components/RepoInput.tsx` | **Modify** | Simplify styling to fit left-aligned layout, more compact |
| `src/pages/Index.tsx` | **Modify** | Use new Navbar + Hero structure |
| `src/index.css` | **Modify** | New background treatment (noise texture), remove old orb styles, add editorial typography utilities |

## Detailed Breakdown

### Navbar (New)
- Fixed top bar, transparent with blur on scroll
- Left: "RepoToContent" brand text (gradient)
- Right: GitHub icon link, optional theme toggle
- Height: ~60px, minimal

### Hero (Rewrite)
- Full viewport height, two-column grid (roughly 45% / 55%)
- **Left column:**
  - Small uppercase label: "AI CONTENT ENGINE"
  - Large heading (left-aligned): 3 lines, big and bold
  - Short description paragraph
  - RepoInput component (simplified, full-width of column)
  - Customize content style toggle (existing)
  - Private repo toggle (existing)
- **Right column:**
  - ContentShowcase component taking full height
  - Vertically centered in the column

### ContentShowcase (New)
- Shows a rotating preview of 3 content types with smooth transitions
- Each "card" is a realistic mock of generated output:
  - **Tweet card**: Avatar, username, tweet text, engagement metrics
  - **Blog preview**: Title, excerpt, reading time
  - **Case study card**: Company name, problem, solution summary
- Tabs at the top of the showcase ("Social Posts" / "Blog" / "Case Studies") auto-cycle but are also clickable
- Cards have a subtle border glow animation when active
- Content is hardcoded example data (not real -- just for the landing page demo)

### Background
- Remove gradient blur orbs
- Add subtle CSS noise/grain overlay (using a tiny base64 noise PNG or CSS filter)
- Optional: faint radial gradient from center for depth
- Clean dark background with minimal visual noise

### Typography
- Heading: 56-64px on desktop, bold, tight tracking (-0.02em)
- Left-aligned throughout
- Subtitle: 16-18px, muted color, max-width constrained

### Responsive Behavior
- On mobile (< 768px): Stacks to single column, showcase moves below input
- On tablet: Narrower split, showcase gets smaller
- Showcase auto-plays on all screen sizes

## Animation Details
- Hero content fades in from left with stagger (using existing Framer Motion)
- ContentShowcase cards transition with a slide + fade (Framer AnimatePresence)
- Tab indicator animates smoothly between positions
- No bouncing, no floating -- smooth and professional

## What Gets Removed
- Sparkle badge ("AI-Powered Content Generation")
- Centered layout pattern
- Gradient blur background orbs
- Feature pills ("Social Posts", "Blog Articles", etc.)
- Scroll indicator mouse animation
- Grid pattern background

## What Makes This Unique
- **Shows, don't tell**: The animated preview demonstrates real output instead of listing features
- **Asymmetric layout**: Feels editorial and intentional, not template-generated
- **Interactive showcase**: Users see exactly what they'll get before clicking Analyze
- **Minimal chrome**: No unnecessary decorations, every element earns its place

