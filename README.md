# M2M Labs (Model to Metal) — website

Live at https://m2mlabs.in

Static site: plain HTML, CSS and JavaScript. No build step, no backend, no database.

```
index.html              the whole page
assets/css/style.css    styles
assets/js/main.js       behaviour + settings (contact email, form endpoint)
assets/favicon.svg      tab icon
```

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
