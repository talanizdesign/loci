# LOCI — landing page

A single-page, scroll-driven landing page for LOCI. One continuous story told through the
letter O: the wordmark reduces to its O, the O becomes a ring of glass cards, the cards
become one idea that adapts to many worlds, the idea becomes a circle that opens into the
only moment of colour, and the visitor's brief folds back into the O.

Built with Vite and TypeScript (no framework), GSAP with ScrollTrigger and SplitText,
Lenis for smooth scrolling, and CSS 3D transforms. The finished site is in the `docs/`
folder, ready for GitHub Pages.

**Quick look:** double-click **`docs/index.html`** to open the finished site in your
browser. No server or Terminal needed: the whole site (styles, scripts and fonts) is
inside that one file.

---

## Contents

1. [Upload the site to GitHub and publish it](#1-upload-the-site-to-github-and-publish-it)
2. [Connect the form (Formspree)](#2-connect-the-form-formspree)
3. [Edit the copy](#3-edit-the-copy)
4. [Change the colours](#4-change-the-colours)
5. [Replace the logo](#5-replace-the-logo)
6. [Run the site on your computer](#6-run-the-site-on-your-computer)
7. [Other settings](#7-other-settings)
8. [How the project is organised](#8-how-the-project-is-organised)

---

## 1. Upload the site to GitHub and publish it

### What to upload, and what to skip

| Upload | Skip |
| --- | --- |
| `docs/` (the finished site — **required**: `index.html`, `favicon.svg`, `og-image.png`, `robots.txt`) | `node_modules/` (huge, rebuilt automatically) |
| `src/` | `.claude/` (local tooling only) |
| `public/` | `.DS_Store` files |
| `index.html` | |
| `package.json` and `package-lock.json` | |
| `vite.config.ts` and `tsconfig.json` | |
| `.gitignore` and `README.md` | |

Strictly, only `docs/` is needed for the site to work. The other files are the source,
so you (or a developer) can change the site later.

> **Tip:** files starting with a dot (like `.gitignore`) are hidden in Finder.
> Press **Cmd + Shift + .** in Finder to show them.

### Step by step

1. Sign in at [github.com](https://github.com).
2. Click **+** (top right) → **New repository**.
3. Give it a name (for example `loci`). Any name works: the site uses relative paths.
4. Choose **Public** (GitHub Pages on a free account needs a public repository).
5. Leave "Add a README" **unticked**, then click **Create repository**.
6. On the next page, click the link **uploading an existing file**.
7. In Finder, open the `Loci` folder, select everything in the "Upload" column above
   (including the `docs`, `src` and `public` folders), and drag it onto the GitHub page.
   Wait until every file has finished uploading.
8. At the bottom, write a short message like "First version" and click **Commit changes**.
9. In the repository, open **Settings** (top menu) → **Pages** (left menu).
10. Under **Build and deployment**:
    - **Source:** *Deploy from a branch*
    - **Branch:** `main`, folder **`/docs`** → click **Save**
11. Wait one or two minutes, then refresh the Pages settings. Your address appears at the
    top, for example `https://your-name.github.io/loci/`.

### Updating the site later

After any change (copy, colours, form ID), rebuild the site (see
[section 6](#6-run-the-site-on-your-computer)), then upload the new `docs/` folder the
same way: **Add file → Upload files**, drag in the `docs` folder, **Commit changes**.
Upload any source files you changed too, such as `src/content.ts`.

---

## 2. Connect the form (Formspree)

GitHub Pages only hosts static files, so the demo request is sent to
[Formspree](https://formspree.io), which forwards each brief to your email.

1. Create a free account at [formspree.io](https://formspree.io) and confirm your email.
2. Click **+ New form**, name it "LOCI demo requests", and choose the email address that
   should receive the briefs.
3. Formspree shows an endpoint like `https://formspree.io/f/xyzabcde`.
   The part after `/f/` (here `xyzabcde`) is your **form ID**.
4. Open `src/config.ts` and replace `YOUR_FORM_ID`:

   ```ts
   export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xyzabcde';
   ```

5. Rebuild the site and upload `docs/` again (see above).
6. Send yourself a test brief from the published site. Formspree may ask you to confirm
   the first submission by email.

Until the ID is set, the published site shows the calm "didn't send" message with a retry
option. While running locally (`npm run dev`) the send is only *simulated*, so you can
review the thank-you animation without a real form.

Test real sends from the published site rather than from a double-clicked
`docs/index.html`: a page opened from your disk has no web address, and Formspree may
refuse to accept briefs from it.

Each brief arrives with the fields `name`, `role`, `company`, `brand` and `email`. A
hidden spam trap (`_gotcha`) is included; Formspree ignores it for real visitors.

---

## 3. Edit the copy

**All text on the page lives in one file: `src/content.ts`.**

Open it in any text editor, change the words between the quotes, save, rebuild, and
upload `docs/` again. Keep the quotes and commas as they are.

- An apostrophe inside text that is wrapped in single quotes needs a backslash (`it\'s`),
  or wrap that text in double quotes instead, as the file already does in a few places.
- `cardLabels` are the tiny labels on the ring's glass cards: one list for desktop
  (24 cards) and a shorter one for phones (14 cards). Each label is used once and
  spread evenly around the ring; all other cards are blank glass.
- `captionWords` are the words that change under the arc in Section 2.
- The form sentence (`demo.brief`) alternates text parts and blanks. In `thanks`,
  `{name}` is replaced with the visitor's name.
- `intro.headline` has two lines; the second is set in gradient text.
- The page title and description used by search engines and link previews are in `meta`.

---

## 4. Change the colours

All colours, fonts and spacing are in **`src/styles/tokens.css`**.

| Token | Use |
| --- | --- |
| `--bg` | Page background, a warm off-white (`#F5F3EE`) |
| `--ink` | Main text (`#26221F`) |
| `--muted` | Decorative secondary tone (`#958E86`). Too light for small text |
| `--muted-strong` | Small secondary text. A darker `--muted` so it passes WCAG AA (`#746D67`) |
| `--placeholder` | The empty blanks in the brief form (`#8A837B`) |
| `--glass` and the `--glass-*` tokens | The glass surfaces |
| `--canyon` | **The primary colour** (`#9A4A44`): the cursor dot, the headline's second line, the favicon |
| `--shadow`, `--rosewood`, `--clay`, `--warm-light` | The other canyon tones the gradients are built from |
| `--gradient` | The takeover in Section 4, and the faint glow behind the ring |
| `--gradient-headline` | The second line of the Section 1 headline (gradient text) |
| `--gradient-button` | The final "Book a demo" button: canyon deepening to rosewood. Off-white text stays above WCAG AA. The only coloured button on the page |
| `--light-a/b/c` | The slowly drifting light behind the glass |

The takeover gradient holds the deep shadow for the top 20%, then opens through canyon
red to clay, with a soft warm light rising from the bottom. Keep its lighter stops low on
the screen: off-white text needs the darker part behind it to stay readable.

---

## 5. Replace the logo

The wordmark is typeset in Inter, and the **O is always its own circle**, because the O
becomes the ring, the portal and the final thank-you circle.

There are two places to change:

- **Top bar** (`index.html`, inside `<a class="topbar__logo logo">`): the letters are
  `L`, an empty `<span class="logo__o">` drawn as a circle, and `CI`. To use an SVG logo,
  replace the contents of that link with your `<svg>` and keep the `aria-label`.
- **Opening wordmark** (`src/stage.ts`, the `wordmark` markup near the top of
  `createStage`): the letters `L`, `C` and `I` are spans that fade away. The O is a
  placeholder that only reserves space; the visible O is the SVG circle (`stage__o`) that
  grows into the ring. Swap the letter spans for SVG letter shapes if needed, but keep
  the `wordmark__o` placeholder so the circle knows where to start.

Also replace `public/favicon.svg` (the O circle) and `public/og-image.png` (the image for
link previews, 1200 × 630). Some social networks need a full address for `og:image`: once
the site is published, change `./og-image.png` in `index.html` to the full URL, for
example `https://your-name.github.io/loci/og-image.png`.

---

## 6. Run the site on your computer

### Preview without installing anything

Open the `Loci` folder in Finder, go into `docs`, and **double-click `index.html`**.
It opens in your browser and works exactly like the published site. Everything the page
needs is built into that one file. Only the favicon and the link-preview image sit next to
it, and those are optional.

Reload the page to watch the opening again. To see the reduced-motion version, add
`?motion=reduced` to the end of the address in the browser's address bar, then press
Return.

### Edit and rebuild

To change the site you need [Node.js](https://nodejs.org) (version 20 or newer). Open
Terminal in the `Loci` folder and run these commands.

Install once, after downloading the project:

```bash
npm install
```

Start a local preview that updates as you edit:

```bash
npm run dev
```

Then open the address it prints (usually `http://localhost:5173`).

Rebuild the `docs/` folder for publishing (this regenerates the single
`docs/index.html`, which you can then double-click to check):

```bash
npm run build
```

Or check the finished build through a local web server, the way GitHub Pages serves it:

```bash
npm run preview
```

To preview the reduced-motion version without changing your system settings, add
`?motion=reduced` to the address, for example `http://localhost:5173/?motion=reduced`.

---

## 7. Other settings

In **`src/config.ts`**:

| Setting | What it does |
| --- | --- |
| `FORMSPREE_ENDPOINT` | Where the demo briefs are sent |
| `CARD_COUNT` | Glass cards in the ring: 24 on desktop, 14 on phones |
| `BLUR_EVERY` | Real backdrop blur is the costliest effect, so only every Nth card uses it; the others use a matched fill. Raise N if the ring stutters on slower machines |
| `MOBILE_MAX` | Width (px) below which the phone layout applies |
| `PIN_LENGTH` | How long each section stays in place, in screen heights |

---

## 8. How the project is organised

```
index.html            Page structure; the copy from src/content.ts is written into it
                      at build time, so the text is real HTML even without JavaScript
src/main.ts           Starts everything: smooth scrolling, sections, top bar, cursor
src/content.ts        All copy
src/config.ts         Form endpoint and tuning settings
src/stage.ts          The fixed layer the story is told on: light, cards, the O, the
                      idea stack, the portal and the gradient takeover
src/sections/         One file per section: intro, ring-to-arc, worlds, surprise, demo
src/topbar.ts         Top bar, chapter progress, "on dark" switching
src/cursor.ts         Cursor dot and magnetic buttons (mouse and trackpad only)
src/mobile-cta.ts     The fixed "Book a demo" button on touch devices
src/reduced.ts        The calm version for visitors who prefer reduced motion
src/lib/              Small helpers: pinning, word reveals, chapter navigation
src/styles/           tokens.css (colours, type, spacing), fonts.css, glass.css, and the rest
public/               Favicon, link-preview image, robots.txt (copied into docs/)
docs/                 The built site that GitHub Pages serves (generated: don't edit).
                      index.html is self-contained: CSS, JavaScript and fonts are inlined
                      by vite-plugin-singlefile, so it also opens straight from the disk
```

**One rule worth knowing:** the cards and the O are never rebuilt between sections.
They live on one fixed stage, and each section only moves values on it, scrubbed by
scroll. That is what lets the whole story play smoothly backwards as well as forwards.

### Accessibility and performance

- Respects *reduce motion*: no pinning, scrubbing, 3D or custom cursor; the sections
  simply fade in, with all copy readable.
- Real text throughout, labelled form fields, visible focus states, full keyboard use, and
  decorative cards hidden from screen readers.
- If scripts fail to load, every section still shows its copy in a calm static layout
  within three seconds, and the brief still submits as an ordinary form.
- Animates only `transform`, `opacity` and `clip-path`; fonts are embedded (woff2 only).
- Lighthouse (desktop, built site): Performance 100, Accessibility 100, Best Practices 100,
  SEO 100.
