# Vermillion — 3D Island Explorer

A self-contained, procedural **3D island explorer** made with Three.js. It is designed to be hosted as a normal static website and embedded into Google Sites. It is not a Google Maps visualization or an image slideshow.

## Included

- One explorable island with hills, sandy coast, sea, roads, trees and hundreds of procedural buildings.
- All **10 established Vermillion cities**: Vermillion City, Harborview, Port Maren, Ravelle, North Bay, Westridge, Lakeside, Clearwater, Sanridge and Eastpoint.
- Oil extraction, export terminals, refinery and tanker assets.
- Renewable energy infrastructure: wind turbines, solar arrays and battery storage.
- Clickable 3D structures, search, city list, filters, fly-to camera, aerial/street-adjacent viewpoints, orbit mode and day/evening lighting.
- Responsive interface for desktop and mobile.

Everything is a **fictional conceptual model**; no claims of live data or precise topography. Buildings are procedural, not photorealistic imported architectural assets. The street button provides a low external camera, **not** Google Street View and not first-person walking controls.

## Files

- `index.html`: layout and import map
- `style.css`: design and responsive behavior
- `app.js`: Three.js 3D scene, location database, controls and interactions

## Preview locally

Run a static web server in this folder. For example:

```sh
python -m http.server 8000
```

Visit `http://localhost:8000` in a modern WebGL-capable browser with internet access. The Three.js module and optional web fonts are loaded from CDNs. Opening `index.html` as a `file://` page may fail due to ES module security policies.

## Publish to GitHub Pages

1. Create a new public GitHub repository, e.g. `vermillion-3d`.
2. Upload **all three files** (`index.html`, `style.css`, `app.js`) into the repository root.
3. Open repository **Settings → Pages**, set **Deploy from a branch**, branch `main`, folder `/ (root)` and save.
4. After deployment finishes, the viewer's URL will resemble `https://YOUR-USERNAME.github.io/vermillion-3d/`.
5. Open the URL directly to confirm the model loads and its controls work.

## Embed into Google Sites

1. In Google Sites, use **Pages → + → Full page embed** (recommended), or **Insert → Embed → By URL** if you want it inside an existing page.
2. Paste the **published GitHub Pages URL** (not a local file or GitHub repository URL).
3. Resize the section if necessary and publish the Site.

Note: Google Sites embedding depends on your site's configuration, external host frame policy, browser WebGL support and network restrictions. If an embed is blocked, use a normal link to the hosted viewer instead. Hosting is not performed automatically by this package.

## Customize locations and map

Edit the `locations` array at the beginning of `app.js` to change place descriptions or coordinates. Buildings and roads below are generated from those coordinates. For major geographic edits, update city generation and roads too.

## Performance

If an older device struggles, reduce building counts in the `neighborhood()` calls and `treeCount`, or lower the renderer pixel ratio. 3D rendering relies on WebGL support and an internet connection to the pinned Three.js CDN.
