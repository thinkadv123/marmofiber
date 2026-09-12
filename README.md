# MarmoFiber

Static multipage website for **MarmoFiber** — an engineered architectural surface
brand backed by Deko Egypt.

*Engineered for Modern Architecture.*

---

## Running it

```bash
npm install
npm run dev
```

```bash
npm run build
```

`npm run build` writes a fully static site to `dist/`, deployable to any static
host (Netlify, Vercel, Cloudflare Pages, S3, plain Apache/nginx). `npm run preview`
serves the built output locally.

**Stack:** HTML5, modern CSS, vanilla JavaScript, Vite, GSAP + ScrollTrigger,
Swiper, Lenis. No framework, no backend, no build-time content system.

---

## Structure

```
├── index.html            01  Home
├── material.html         02  The Material
├── collections.html      03  Collections
├── applications.html     04  Applications
├── projects.html         05  Projects
├── story.html            06  Our Story
├── technical.html        07  Technical
├── contact.html          08  Contact
│
├── partials/             build-time HTML includes (header, footer, rail, chrome)
├── css/
│   ├── main.css          design system + all components
│   └── responsive.css    breakpoints, large → small
├── js/
│   ├── main.js           entry: smooth scroll, chrome, filtering, modals, form
│   ├── animations.js     scroll-driven motion and the pinned sections
│   ├── sliders.js        Swiper instances with custom GSAP transitions
│   └── page-transitions.js  loader + curtain between pages
├── assets/
│   ├── images/           hero and section photography
│   ├── projects/         five images per built project (thumb + 01-04)
│   ├── finishes/         web-ready finish swatches used on the site
│   ├── products/         original client swatch files (source, not shipped)
│   ├── certificates/     Deko Egypt management-system certificates
│   ├── textures/         background textures
│   └── logo/             MarmoFiber logo files
├── public/assets/documents/   PDFs served as-is (placeholders)
└── vite.config.js
```

### Shared header, footer and rail

The chrome lives in `partials/` and is inlined at build time by a small Vite
plugin. Use it from any page:

```html
<!-- @include partials/header.html -->
```

Edit `partials/header.html` once and every page updates. There is no runtime
cost — the markup is in the shipped HTML.

Each page declares its own identity on `<body>`, which drives the active nav
state and the number in the left rail:

```html
<body data-page="collections" data-page-number="03" data-page-label="Collections">
```

### Adding a page

1. Create `newpage.html` in the root (copy an existing page as a starting point).
2. Add `'newpage'` to the `PAGES` array in `vite.config.js`.
3. Add the link to `partials/header.html` and `partials/footer.html`.

---

## Editing content

Everything below is plain markup — no JavaScript changes required.

| What | Where |
| --- | --- |
| Finishes (name, code, description, image) | `collections.html` — `data-*` on each `<article class="finish-card">`; these feed both the card and the detail modal |
| Projects (copy, gallery, metadata) | `projects.html` — `data-*` on each `<a class="project-tile">`; these feed the detail overlay. Images live in `assets/projects/<slug>/` as `thumb.webp` + `01`–`04.webp` |
| Homepage hero slides | `index.html` — each `<article class="hero__slide">` |
| Application sections | `applications.html` |
| Timeline entries | `story.html` — copy one `.timeline-v__item` |
| Downloads | `public/assets/documents/` — replace the PDFs, keep the filenames |
| Contact details, social links, legal lines | `partials/footer.html`, `partials/header.html`, `contact.html` |

### A note on `data-*` image paths

Vite rewrites `src` and `href` in HTML, but not paths stored in `data-*`
attributes. The finish modal and the project overlay load their images from
`data-image` / `data-gallery`, so `js/main.js` maps those paths to the built
(hashed) URLs through `import.meta.glob`. If you add a new folder of images that
is loaded this way, add it to the `ASSET_URLS` globs at the top of `main.js`.

### Reusable behaviours

Add these attributes to new markup and the existing JavaScript picks them up:

| Attribute | Effect |
| --- | --- |
| `data-reveal` | fade + rise into view |
| `data-reveal-group` | stagger the direct children |
| `data-split` | animate `.line > span` (lines are written in the HTML) |
| `data-parallax="0.18"` | slow vertical drift on scroll |
| `data-mask` | clip-path image reveal |
| `data-count="1995"` | number counts up once |
| `data-cursor="Explore"` | label shown inside the desktop cursor on hover |
| `data-magnetic="0.24"` | button drifts toward the pointer |
| `data-filter-group` | wraps a filterable grid; items carry `data-tags`, buttons carry `data-filter` |

---

## Contact form

The site is static, so the form needs a third-party endpoint. Open `js/main.js`
and pick one:

1. **Formspree (default path)** — set `FORM_ENDPOINT` to your form URL.
2. **Netlify Forms** — add `data-netlify="true"` and a hidden `form-name` input
   to the `<form>` in `contact.html`, then remove the `fetch()` branch.
3. **No backend** — leave `FORM_ENDPOINT` empty and the form composes a
   prefilled `mailto:` to `MAIL_FALLBACK`.

Deep links work out of the box: `contact.html?enquiry=sample&finish=Caramel`
preselects the enquiry type and prefills the finish.

---

## Placeholders to replace before launch

- **Section photography** in `assets/images/` — the four homepage hero slides
  and the projects page hero are real MarmoFiber work. The remaining material,
  application and detail shots are still Unsplash placeholders; filenames
  describe their role (`app-facade.webp`, `stage-02-fiber.webp`) so
  replacements drop straight in.
- **Chairman portrait** — `assets/images/portrait-chairman.webp` is an abstract
  architectural stand-in. Marked with a `TODO` comment on both pages that use it.
- **Technical PDFs** in `public/assets/documents/` — every file is a marked
  placeholder. See the README in that folder.
- **Project locations** — five records show only "Egypt" because the city is not
  yet confirmed: Arab African Bank, Al Aly Al Azaeem Mosque, El Mo'oz Mosque,
  Al Marasem, Medicom. There is a `TODO` comment above the grid listing them.
- **Project copy** — written from the project photography, describing the visible
  architectural work. No client briefs, dates, areas, awards or performance
  figures are stated anywhere on the site. Swap in approved case-study copy when
  it is available.
- **Domain** — canonical and Open Graph URLs use `https://www.marmofiber.com/`.
  Search for `marmofiber.com` and update once the domain is confirmed.
- **Contact details** — email and phone are placeholders (`TODO` comments in
  `partials/header.html`, `partials/footer.html` and `contact.html`).
- **Legal entity** — the copyright and trademark lines in `partials/footer.html`
  are written to stay editable until the legal owner is confirmed.

The two ISO certificates on `technical.html` are genuine documents issued to
**Deko Egypt for Modern Construction** and are labelled as such.

---

## Accessibility and performance notes

- Semantic HTML, one `<h1>` per page, skip link, visible focus rings.
- Sliders, menus and overlays are keyboard operable; overlays trap focus and
  close on <kbd>Esc</kbd>.
- Alt text on every meaningful image; decorative images are `aria-hidden`.
- `prefers-reduced-motion: reduce` disables the motion system *and* unfolds the
  pinned sections into plain stacked layouts, so no content is reachable only
  through an animation.
- Below-the-fold images are lazy-loaded; only the first hero image is preloaded.
- Images ship as WebP with explicit `width`/`height` to avoid layout shift.
- Desktop-only extras (custom cursor, magnetic buttons, pinned scroll sections)
  are gated behind media queries and never run on touch devices.
