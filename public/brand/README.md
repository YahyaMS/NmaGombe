# Brand assets — provenance and rules

## Where these came from
The supplied `crest.svg` was **not vector artwork**. It was a 1242×1198 JPEG screenshot
(complete with a Google Lens watermark in the corner) wrapped in an SVG container and clipped to
a circle. It could not be recoloured, could not be scaled for print, and carried a third-party UI
element into the institution's identity.

These assets were rebuilt by isolating the crest, removing the watermark, and vector-tracing the
artwork. `crest.svg` is now genuine vector geometry.

**This is a stopgap, not a resolution.** Traced artwork is an approximation of the original
drawing — the lettering and the caduceus detail are reconstructions, not the source curves.
`00-INTAKE.md` item 13 still stands: obtain the official crest from the NMA national secretariat
before anything goes to print (membership cards, certificates, letterheads, banners). For screen
use these are fine.

## Files
| File | Size | Use |
|---|---|---|
| `crest.svg` | 1000×1000 viewBox | Everything on screen. Fill is `currentColor` — set the colour in CSS, never edit the file. |
| `icon-192.png` | 192×192 | PWA manifest, `purpose: any` |
| `icon-512.png` | 512×512 | PWA manifest, `purpose: any` |
| `icon-maskable-512.png` | 512×512 | PWA manifest, `purpose: maskable`. Crest sits at 62% of the canvas so Android's circular and squircle masks never clip the outer ring or the lettering. |
| `apple-touch-icon.png` | 180×180 | iOS home screen. iOS ignores `maskable` and applies its own rounding. |
| `favicon-32.png` / `favicon-16.png` | 32 / 16 | Browser tab |
| `crest-white-1024.png` | transparent | Folio card, receipts, anywhere the SVG can't be used |
| `crest-green-1024.png` | transparent | Documents and light grounds |
| `og-default.jpg` | 1200×630 | Link preview when a page has no image of its own — this is what shows in WhatsApp when a member shares a link |

## Colour rules
The crest is **monochrome only** — white on `--green-deep`, or `--green` on white. Never
multicolour, never on a photograph, never with a drop shadow, never rotated or stretched.

Because `crest.svg` uses `currentColor`, colour it with CSS:
```tsx
<Crest className="h-8 w-8 text-white" />        // on the masthead
<Crest className="h-6 w-6 text-[--green]" />    // on light grounds
```

Clear space on all sides is at least 15% of the crest's diameter. Minimum rendered size on
screen is 24px — below that the lettering turns to mush and you should use a plain wordmark instead.

## Budget note
`crest.svg` is 105KB raw, ~38KB gzipped — roughly 11% of the 350KB first-load budget in
`CLAUDE.md`. It is cached after first load, so it is acceptable, but if the budget gets tight the
fix is to inline a simplified single-ring mark in the masthead and reserve the full crest for the
folio card and footer. Do not solve it by swapping in a PNG; that loses the `currentColor` recolour.
