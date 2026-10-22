# M2M Labs (Model to Metal) — website

Live at https://m2mlabs.in

Static site: plain HTML, CSS and JavaScript. No build step, no backend, no database.

```
index.html                 the whole page
assets/css/src/light.css   light theme (cream and coral)  — edit this
assets/css/src/dark.css    dark theme (stars and brass)   — edit this
assets/css/light.css       generated from src/light.css   — don't edit
assets/css/dark.css        generated from src/dark.css    — don't edit
assets/css/theme.css       shared: theme switch, brand line, switch transition
assets/js/main.js          behaviour + settings (contact email, form endpoint)
assets/favicon.svg         tab icon, light theme
assets/favicon-dark.svg    tab icon, dark theme
tools/build_css.py         scopes each theme's CSS to that theme
```

## Two themes

The site has a light theme (default) and a dark theme, switched by the sun/moon button
(beside "Start a project" in light, last key in the dock in dark). The visitor's choice is
remembered. After editing `assets/css/src/light.css` or `src/dark.css`, run:

```
python tools/build_css.py
```

and bump the `?v=` stamp on the stylesheet and script links in `index.html` so browsers
fetch the new files.

## Before you deploy

Open `assets/js/main.js` and edit `CONFIG` at the top:

- `contactEmail`: the address enquiries should reach.
- `formEndpoint`: optional. Create a free form at https://formspree.io, copy its endpoint
  (`https://formspree.io/f/xxxxxxx`) and paste it here. Submissions are then emailed to you.
  If left empty, the form opens the visitor's email app with the message pre-filled.

Photos live in `assets/img/` (portrait 640×800 and a 160×160 avatar, WebP + JPG). To change the
photo, replace those four files with the same names and sizes.

## Adding team members (later)

In `index.html`, find the `TEAM` comment in the Studio section. Copy the commented
`MEMBER TEMPLATE` block, uncomment it, fill in name / role / links, and add the person's
photo to `assets/img/`. With two or more members the section switches automatically
from "founder beside text" to a team grid. No CSS changes needed.

## Preview locally

Open `index.html` in a browser, or run `python -m http.server 8000` in this folder and visit
http://localhost:8000.

## Deploy (pick one)

- **Netlify:** drag this folder onto https://app.netlify.com/drop.
- **Vercel:** `npx vercel` in this folder (framework: Other, no build command).
- **GitHub Pages:** push to a repo → Settings → Pages → deploy from branch `main`, folder `/`.

Then point your domain at it in the host's domain settings.
