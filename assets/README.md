# Static assets

Favicon set — white rounded square with a thin light-grey border, "ARC" (the first three
letters of Archilect) in near-black, Georgia as a close local stand-in for the Cormorant
Garamond brand font (system-rendered, so no extra font dependency for a handful of pixels):

- `favicon.ico` — multi-size (16×16, 32×32, 48×48), also mirrored at the project root so
  browsers that request `/favicon.ico` directly (without reading the `<link>` tags) still find it
- `favicon-32x32.png`, `favicon-16x16.png` — referenced explicitly for browsers that prefer PNG
- `apple-touch-icon.png` — 180×180, used when the site is added to an iOS/iPadOS home screen

All four are linked from the `<head>` of every page (`index.html`, `trading-checklist.html`,
`trading-journal.html`). Regenerate by re-rendering `assets/favicon.ico`'s source design (a
1024×1024 SVG — rounded square background, centered "ARC" text) and re-exporting each size.
