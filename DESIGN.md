# Design System - GiftOS

## Product Context
- **What this is:** A private gift tracker for one relationship, focused on remembering what was given, what it cost, and what occasion is coming next.
- **Who it's for:** A single owner who wants thoughtful gift memory, occasion planning, and spending visibility without social wishlist noise.
- **Space/industry:** Personal planning, relationship memory, occasion management.
- **Project type:** Hosted web app.

## Aesthetic Direction
- **Direction:** Boutique Editorial
- **Decoration level:** Intentional
- **Mood:** Curated, warm, and personal. The app should feel like a private journal with good taste, not a generic productivity dashboard.
- **Reference sites:** The intended feel is editorial stationery and modern magazine layout, translated into a structured app shell.

## Typography
- **Display/Hero:** `Instrument Serif` - Used for page heroes, occasion titles, and planner section headings where the product needs emotional lift.
- **Body:** `Plus Jakarta Sans` - Used for forms, navigation, body copy, and dense planner UI because it stays crisp and calm.
- **UI/Labels:** `Plus Jakarta Sans`
- **Data/Tables:** `IBM Plex Sans` - Used for compact metadata, amounts, tags, and utility rows where rhythm and clarity matter.
- **Code:** `IBM Plex Mono`
- **Loading:** Google Fonts or Bunny Fonts for `Instrument Serif`, `Plus Jakarta Sans`, and `IBM Plex Sans`.
- **Scale:**
  - Hero: `clamp(3.25rem, 7vw, 5.5rem)`
  - Display 1: `3rem`
  - Display 2: `2.25rem`
  - Heading 1: `1.75rem`
  - Heading 2: `1.375rem`
  - Body: `1rem`
  - Small: `0.875rem`
  - Eyebrow/meta: `0.75rem`

## Color
- **Approach:** Restrained with ceremonial accents
- **Primary:** `#A64B3C` - Lacquer red, used for primary actions, key accents, and emphasis moments.
- **Secondary:** `#D6B36A` - Brushed brass, used sparingly for occasion highlights, rule lines, and premium accent details.
- **Neutrals:**
  - `#FFFDFC` porcelain
  - `#F7F1E8` soft paper
  - `#E6D8CA` warm line
  - `#6E625B` stone
  - `#1F1A18` ink
- **Semantic:**
  - success `#4E7A57`
  - warning `#B37A2A`
  - error `#9F3A34`
  - info `#486A86`
- **Dark mode:** Not a priority for the current slice. If introduced later, keep surfaces warm and low-glare instead of inverting into cold charcoal.

## Spacing
- **Base unit:** `8px`
- **Density:** Comfortable
- **Scale:** `2xs(4) xs(8) sm(12) md(16) lg(24) xl(32) 2xl(48) 3xl(64)`

## Layout
- **Approach:** Hybrid
- **Grid:** Structured app shell for navigation and forms, with more editorial composition inside page headers and occasion planner sections.
- **Max content width:** `1280px`
- **Border radius:**
  - sm: `8px`
  - md: `14px`
  - lg: `22px`
  - xl: `30px`
  - pill: `999px`

## Motion
- **Approach:** Intentional
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`
- **Duration:**
  - micro `80-120ms`
  - short `160-220ms`
  - medium `260-360ms`
  - long `420-560ms`
- **Usage:** Use motion for section reveals, planner-item reordering, and milestone state changes. Avoid decorative motion in dense CRUD flows.

## Screen Rules
- Dashboard stays structured and legible first. Editorial treatment belongs in hero blocks and highlights, not in every card.
- Occasion pages get the strongest design treatment: large serif headings, fine rule lines, stronger accent use, and more generous spacing.
- Forms stay practical. Never use serif body text in input-heavy surfaces.
- Data rows, prices, and metadata should prefer `IBM Plex Sans` or tabular numeric settings where possible.
- Avoid purple gradients, generic SaaS icon circles, and overly bubbly rounded cards.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-30 | Initial design system created | Boutique Editorial fits the emotional tone of private gift memory while still supporting a reliable planner UI. |
