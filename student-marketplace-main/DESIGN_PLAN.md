# Design plan — campus noticeboard

**Direction.** Friendly, clear and trustworthy, a little playful. Quiet neutral surfaces; spend the boldness on two things: the **price tag** on listing cards and the **photo viewer**. No gradient washes, no decorative blobs, no shadow on every card.

**Tokens** (CSS variables in `src/index.css`, mapped in `tailwind.config.js`): `--ink #16213A`, `--chalk #F4F6FB`, `--surface #FFFFFF`, `--cobalt #2344D8`, `--sun #F5B700`, `--mint #1FA67A`, `--coral #E5484D`. Borders and muted text derive from `--ink` at low opacity; all body text meets 4.5:1 on its surface.

**Compatibility remap.** The existing `primary` and `indigo` ramps map to cobalt, and `slate` maps to an ink/chalk neutral ramp, so all pages change consistently before component-level refinement. `amber`, `emerald` and `rose` are not blindly remapped: rating caps use `--sun` explicitly, success uses `--mint`, errors use `--coral`.

**Typography.** Bricolage Grotesque for headings, logo and prices; Manrope for body, forms and buttons (Google Fonts `<link>`, `display=swap`, system fallbacks). Scale 12 / 14 / 16 / 20 / 28 / 40. Prices use display font and tabular numerals; body line length stays under 75 characters.

**Rules.** Radius hierarchy: cards `rounded-xl`, buttons/inputs `rounded-lg`, chips `rounded-full`. Sentence case, no ALL-CAPS eyebrows, no "A → B → C" meta strings, no arrows appended to every button. Buttons name their action ("Post listing", "Save changes", "Delete listing"). Errors say what failed and how to fix it; empty states invite an action.

**Motion.** Only in response to user actions (hover, press, modal open, favorite toggle, photo change). No scroll-triggered fades. `prefers-reduced-motion` collapses all transitions.

**Focus and access.** Visible `:focus-visible` ring in `--cobalt`, 2 px offset, on every interactive element. Light theme only; a dark theme is the first thing to cut.

**Card.** Fixed 4:3 photo with lazy/async loading and a local `ImageOff` fallback, price tag overlapping the bottom-left corner with a notch detail, two-line title, condition/category badges, heart top-right, seller link and actions slot in the footer. No seller-rating chip: the listing DTO has no stats and per-card profile calls are forbidden.
