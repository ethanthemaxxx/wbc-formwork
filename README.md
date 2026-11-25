# Formwork — concept site

An original concept site for Formwork, a fictional AI-automation studio for operations teams. It reproduces the structure, grid, proportions, type scale and motion of a studied reference template; the name, logo, colours, fonts, copy, images and code are new.

Static HTML, CSS and JS. No build step, relative paths, ready for the root of a GitHub Pages subdomain.

## Pages

| Path | Page |
|---|---|
| `index.html` | Home: hero diagram, services, process, results, cases, sectors, stack, values, voices, pricing, FAQ, footer |
| `solutions/` | Six flows, the four-step process, pricing |
| `work/` | Case index with a preview that follows the hovered or focused row |
| `work/tollmere-dock-ops/` | The one case written in full |
| `contact/` | Assessment request form with local validation, sending, success and error states |
| `404.html` | "This route doesn't exist yet. We can build it." |

`404.html` uses root-absolute paths (`/css/site.css`, `/contact/`…) so its styles and links resolve from any missing URL on the subdomain, and its skip link stays on the page.

## Fonts

- **Schibsted Grotesk** 400–700 (Google Fonts): headlines, figures, body.
- **Martian Mono** variable, `wdth` 75–112.5, 400–500 (Google Fonts): labels, buttons, navigation, fields at 87.5 % width; the wordmark at 112.5 %.

## Libraries

None. Vanilla JS (`js/site.js`), IntersectionObserver, CSS animations and canvas 2D.

## What reproduces the reference

- Six-column grid drawn on the page (solid, dashed and an accent guide on the third boundary, crosses at rule intersections), full-bleed rules, sections one screen tall on rows of `clamp(200px, 25vh, 250px)`.
- Headline patterns: hanging from the full-bleed rule (pattern A, H2 in C1–C2 with the tag above the rule) or sitting on it from the C3 guide (pattern B); the H1 sits on the rule at the bottom of row 1. Numbered chapter tags 01–12 on the home page only; inner pages use unnumbered tags.
- Alternating paper / white / stone / dark grounds, grain on dark sections.
- One hover grammar: a 450 ms left-to-right wipe with an arrow on every solid button; an arrow that pushes the label on text links.
- Two-tone ordered dither on every photo (canvas 2D), a drifting dot field behind the hero, values, inner heroes and footer, a hero diagram that assembles in about 2.6 s, a pipeline that lights up in a 3.7 s loop, an integrations ring that turns into place, sliders for cases and voices, an accordion FAQ, a work index with live preview.
- Breakpoints: 6 columns from 810 px, tighter type from 1439 and 1199 px, one column below 810 px with a full-width menu.

## What is original

- Brand, logo (formwork bracket around a square, SVG), wordmark, palette (cold paper `#eef0f2`, stone `#d9dde1`, dark `#121417`, ink `#15181c`, plotter cyan `#0a8bb0` / `#08708f`), fonts, all copy (from `COPY.md`), the hero diagram, every icon, the process map, the client wordmarks.
- The dot field is generated in code (no image) and repeats without a visible join.
- Integrations show generic system types with drawn icons, no third-party logos.
- Accessibility the reference lacks: skip link, real buttons with `aria-expanded` and labels, focus trap and Escape for the menu, visible focus, one `h1` per page, reduced-motion support (everything visible and still), a Pause motion control in the footer, AA contrast.

## Assets

Photos: `assets/w-01…03.webp` (operations scenes, 1000 px wide) and `assets/p-01…05.webp` (portraits, 600 px), all shown through the two-tone dither. Replaced with CSS/SVG: the hero diagram, the dot field ("terrain"), grain, every icon and pictogram, the process map on the case page, the client wordmarks (set in type). `assets/og.jpg` (1200×630) is a capture of the site's own hero; pages reference it at `https://formwork.wolfbc.art/assets/og.jpg`.

## Known differences from the brief

- Solutions page follows the reference's section order (hero, flows, process, pricing, footer) and leaves out the FAQ.
- On phones some secondary text is hidden to keep sections close to the reference's height: service and result descriptions, flow IN/FLOW/OUT details and two signed notes. Plan contents, all three pricing buttons and the work-index preview stay visible.
- Forms never send anything. The footer mini form carries name and email to the contact form through `sessionStorage` (never in the URL); the contact form shows a local success state, and `?demo=error` shows the error state.
- The work index rows are buttons: hover, focus, click or tap changes the preview.
