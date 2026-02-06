

# Hero Header + Content Showcase Redesign

## 1. Two-line Header

The heading currently spreads across 3 visual lines ("Your repo already has a" / "story." / "We help you tell it."). We'll restructure it into exactly two impactful lines:

**Line 1:** "Your repo already has a story."  
**Line 2:** "We help you tell it."

- Remove the `<br />` tag between "story." and the second line
- Put "Your repo already has a story." on line 1 with "story." in gradient
- Put "We help you tell it." on line 2 in muted color
- Both lines stay at the same bold size for visual weight

## 2. Content Showcase Redesign

The current tab box has several issues: the outer container feels generic, the tabs look like basic buttons, and the whole thing lacks the polish of the rest of the page. Here's the uplift:

### Tab bar redesign
- Replace the plain button tabs with a contained pill-style tab bar -- a single rounded background strip (`bg-secondary/30 rounded-lg p-1`) housing the tab buttons
- Active tab gets a solid pill background (`bg-card`) with a subtle shadow, animated with Framer Motion `layoutId`
- Add small icons next to each tab label for visual interest (MessageCircle for Social Posts, FileText for Blog, BarChart3 for Case Studies)

### Outer container cleanup
- Strip the outer wrapper back to clean and minimal -- remove corner dots (too "techy blueprint"), remove the gradient top-edge line
- Use a cleaner, slightly more visible border (`border-border/30`) and stronger background (`bg-card/40`)
- Keep the hover glow but make it subtler
- Remove the bottom "AI-generated from repo analysis" label -- it adds noise

### Inner card improvements
- Increase the minimum height slightly to `min-h-[260px]` for consistent sizing
- Keep the progress bar but make it thinner (`h-[1.5px]`) and more subtle
- Smoother content transitions with slightly adjusted animation values

### Overall spacing
- Tighten padding and margins for a more compact, intentional feel
- The "SEE WHAT WE GENERATE" label above stays but gets a slight style tweak -- smaller tracking, less aggressive uppercase

---

## Technical Details

### File: `src/components/Hero.tsx`
- Restructure the `<h1>` to remove the `<br />` tag
- Line 1: `Your repo already has a <span class="gradient-text">story.</span>` -- all on one line, no forced break before "story."
- Line 2: stays as `<span class="text-muted-foreground">We help you tell it.</span>` with a `<br />` before it

### File: `src/components/ContentShowcase.tsx`
- Import `MessageCircle` (already imported), `FileText`, `BarChart3` from lucide-react
- Replace the tab section with a pill-style tab bar: outer `div` with `bg-secondary/30 rounded-lg p-1 flex gap-0.5`
- Each tab button gets an icon + label, active tab has `bg-card shadow-sm` pill animated via `layoutId`
- Remove the 4 corner dot divs
- Remove the gradient top-edge line div
- Remove the bottom label div ("AI-generated from repo analysis")
- Simplify outer container classes: `relative p-3 rounded-2xl bg-card/40 border border-border/30 shadow-soft transition-shadow duration-500 hover:shadow-glow`
- Update the separator to be more subtle
- Inner card: keep `min-h-[260px]`, progress bar to `h-[1.5px]`

### File: `src/pages/Index.tsx`
- Change the "SEE WHAT WE GENERATE" text styling: reduce `tracking-widest` to `tracking-wider`, keep `uppercase`

