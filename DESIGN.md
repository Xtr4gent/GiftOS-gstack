# Design System - GiftOS

## Product Context
- **What this is:** A private gift tracker for one relationship, focused on memory, planning, and staying thoughtful across the whole year.
- **Who it's for:** A single owner who wants one place to remember gifts, see patterns, and plan occasions without social wishlist clutter.
- **Space/industry:** Personal planning, relationship memory, occasion management.
- **Project type:** Hosted web app.

## Aesthetic Direction
- **Direction:** Midnight Keepsake
- **Decoration level:** Intentional
- **Mood:** Private, intimate, and a little cinematic. The app should feel like a beautifully kept after-hours journal, not a generic admin dashboard with a dark theme toggle slapped on top.
- **Reference feel:** Velvet-box luxury, low-light stationery, soft glow, editorial romance, disciplined app shell.
- **What changes from the old system:** GiftOS is no longer warm paper by default. Dark mode is now the default visual identity. Pink is the emotional accent, not a novelty color.

## Typography
- **Display/Hero:** `Instrument Serif`
  Used for page heroes, occasion titles, planner section headings, and key emotional moments.
- **Body:** `Plus Jakarta Sans`
  Used for forms, navigation, body copy, and dense planner UI because it stays calm and readable in dark surfaces.
- **UI/Labels:** `Plus Jakarta Sans`
- **Data/Tables:** `IBM Plex Sans`
  Used for prices, metadata, tags, counters, and dense utility rows where clarity matters more than mood.
- **Code:** `IBM Plex Mono`
- **Loading:** Google Fonts or Bunny Fonts for `Instrument Serif`, `Plus Jakarta Sans`, and `IBM Plex Sans`.
- **Scale:**
  - Hero: `clamp(3.2rem, 7vw, 5.25rem)`
  - Display 1: `3rem`
  - Display 2: `2.3rem`
  - Heading 1: `1.8rem`
  - Heading 2: `1.4rem`
  - Body: `1rem`
  - Small: `0.875rem`
  - Eyebrow/meta: `0.75rem`

## Color
- **Approach:** Dark-first with luminous pink accents
- **Primary accent:** `#F05DA8`
  Electric rose for primary actions, active states, and key attention moments.
- **Secondary accent:** `#FF9ED1`
  Soft blossom pink for hover states, supporting emphasis, and glow gradients.
- **Highlight accent:** `#FFD6E8`
  Pale petal for tinted surfaces, outlines, and light text on dense accent blocks.
- **Anchor darks:**
  - `#120F17` midnight plum
  - `#18131F` ink velvet
  - `#221A2C` aubergine surface
  - `#2C2238` lifted panel
- **Neutrals:**
  - `#F7EEF5` moon milk
  - `#D7CAD8` dusty mauve
  - `#A897B0` faded lilac gray
  - `#7A6B85` soft graphite
- **Semantic:**
  - success `#55D39A`
  - warning `#F2B45A`
  - error `#F36B87`
  - info `#7BC4FF`

## Surface Rules
- The app background should never be flat black. Use layered dark plums and low-contrast gradients.
- Major surfaces should step up in brightness gradually:
  - page background
  - sidebar / shell
  - standard cards
  - highlighted planner cards
- Pink should glow against the dark base, but only in action areas, counts, highlights, and selective dividers.
- Avoid hot-pink overload. If everything is pink, nothing is pink.
- White should be slightly softened on dark backgrounds. Prefer `moon milk` tones over pure `#ffffff`.

## Spacing
- **Base unit:** `8px`
- **Density:** Comfortable, slightly roomier than generic dashboard defaults
- **Scale:** `2xs(4) xs(8) sm(12) md(16) lg(24) xl(32) 2xl(48) 3xl(64)`

## Layout
- **Approach:** Hybrid
- **Grid:** Structured app shell with expressive hero and planner sections.
- **Max content width:** `1280px`
- **Border radius:**
  - sm: `8px`
  - md: `14px`
  - lg: `22px`
  - xl: `30px`
  - pill: `999px`
- **Shell guidance:**
  - Sidebar should feel like a dark lacquer panel, not a default left rail.
  - Main content should sit on layered dark gradients with strong card separation.
  - Planner pages deserve the richest treatment, especially Anniversary, Birthday, Christmas, and Theme of the Year.

## Motion
- **Approach:** Intentional and low-glare
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`
- **Duration:**
  - micro `80-120ms`
  - short `160-220ms`
  - medium `260-360ms`
  - long `420-560ms`
- **Usage:**
  - subtle glow or lift on hover for primary actions
  - soft reveal for recommendation cards and planner sections
  - satisfying state shift when marking gifts given or promoting planner drafts
  - no floaty gimmicks, no neon nightclub animation nonsense

## Component Rules
- **Buttons:**
  - Primary buttons use the electric rose accent with darker pink shadows.
  - Secondary buttons should be dark glass or lifted-panel treatments, not pale ghost buttons from the old paper system.
- **Cards:**
  - Standard cards use aubergine surfaces with soft borders and shadow separation.
  - Hero cards can introduce richer pink-violet gradients, but keep text readable and grounded.
- **Inputs:**
  - Inputs should be darker filled surfaces, not white fields dropped onto a dark page.
  - Focus states should use bloom-pink outlines or glow rings.
- **Counts / chips / tags:**
  - Prefer tinted dark pills with pink or pale-petal text.
  - Utility chips should still feel crisp, not candy-like.
- **Recommendation cards:**
  - Use subtle gradient tinting so they feel a little special.
  - Avoid making every recommendation card the same saturated pink.

## Screen Rules
- **Dashboard:** stays readable first. Use the dark system to add mood, not clutter. Recommendation hints and key occasion blocks get the strongest accent moments.
- **Occasion pages:** these are the emotional center of the app. Use richer gradients, stronger dividers, serif headings, and sharper section hierarchy.
- **Theme of the Year:** this page should feel the most dreamlike, but still usable. Month sections can take on a softer glow than the stricter occasion planners.
- **Settings and forms:** calmer, flatter, more utility-driven. Less sparkle. More legibility.
- **Login page:** should feel premium and private. This is the best place for the strongest dark-to-pink hero treatment.

## Anti-Patterns
- Do not mix this with beige-paper cards from the previous design system.
- Do not use pure black backgrounds, default Tailwind dark grays, or cold blue-black enterprise dark mode.
- Do not turn pink into bubblegum or gamer RGB.
- Do not use purple as the dominant accent. Pink leads. Purple supports from the shadows only.
- Do not flatten every section into the same card style. The app should have hierarchy.

## Implementation Notes
- Existing font choices are still valid. Keep `Instrument Serif`, `Plus Jakarta Sans`, and `IBM Plex Sans`.
- The first code pass should start in [`src/app/globals.css`](C:\Users\Gabe\Documents\Playground\src\app\globals.css), replacing the current paper-tone CSS variables with dark-first tokens.
- Audit high-visibility surfaces first:
  - login
  - sidebar
  - dashboard hero / recommendation cards
  - planner section cards
  - buttons and inputs
- Preserve accessibility. Pink accents need strong contrast against the dark base. Test form labels, muted copy, and count pills carefully.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-30 | Initial design system created | Boutique Editorial fit the original warm-journal direction. |
| 2026-04-03 | Replaced the default system with Midnight Keepsake | Dark mode with pink accents better matches the user's taste while keeping GiftOS intimate, premium, and emotionally distinct. |
