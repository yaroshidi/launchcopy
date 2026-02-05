

# Uplift the Content Showcase

Wrap the rotating tabs showcase in a polished container with subtle pro-level effects -- gradient border lines, inner glow, refined shadows, and a slight floating animation -- while keeping it tasteful and not overdone.

## What Changes

### 1. Outer wrapper with gradient border effect
- Add a container `div` around the entire showcase with a 1px gradient border (primary-to-accent) using the CSS border-image or pseudo-element technique
- Rounded corners (`rounded-2xl`) with a slight background fill using `bg-card/50` and `backdrop-blur`
- Padding around the whole thing so the tabs and card sit inside with breathing room

### 2. Subtle glow and shadow
- Apply the existing `shadow-medium` plus a faint `shadow-glow` on the outer container for depth
- On hover, transition to a slightly stronger glow (using Tailwind `hover:` or Framer `whileHover`)

### 3. Corner accent dots
- Four tiny gradient dots (4px) positioned at each corner of the outer container using absolute positioning -- a subtle "engineering blueprint" detail that adds polish without noise

### 4. Inner card refinements
- The existing card (`rounded-xl border border-border/60`) stays, but gets a slightly more refined border: `border-border/40` to let the outer container's gradient border be the star
- Add a very faint inset shadow to give the card depth within the container

### 5. Tab bar polish
- Move the tab bar inside the container's padding so it feels integrated
- Add a faint separator line (`h-px bg-border/30`) between the tabs and the card content

### 6. Bottom label integration
- The "AI-generated from repo analysis" label moves inside the container padding, making the whole thing feel like one cohesive unit

---

## Technical Details

**File: `src/components/ContentShowcase.tsx`**

- Wrap the return JSX in a new outer `div` with classes: `relative p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/20 shadow-medium group transition-shadow duration-500 hover:shadow-glow`
- Add a gradient top-edge line on the outer container using a pseudo-element div: `absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent`
- Add four corner dots using absolute-positioned `div` elements (2x2px, `bg-primary/40`, `rounded-full`) at each corner with small offsets
- Reduce the inner card border from `border-border/60` to `border-border/30`
- Add a faint separator `div` (`h-px bg-border/20 mx-1`) between the tabs row and the card
- Pull the bottom label inside the outer container padding

**File: `src/index.css`** -- No changes needed, existing utilities cover everything.

