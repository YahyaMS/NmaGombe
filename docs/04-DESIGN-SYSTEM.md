# 04 — Design system

## Direction: "The Register"
Nigerian hospital practice runs on the register book and the folio number. The folio number is
the thing that legally makes a doctor a doctor. So the visual language is drawn from the
artefacts of that world — the ruled register, the stamped card, the typed index — rendered with
modern precision rather than nostalgia. Not a "healthcare website." A professional instrument.

**Signature element:** the **folio card**. The digital membership card is a real object —
correct proportions, embossed crest, folio number set in monospace, a hairline rule and a
mono eyebrow label. That card's construction (mono eyebrow → 3px green rule → content) is then
the structural motif for every section on the site. One idea, applied everywhere, and nowhere else.

Everything around the card stays quiet. That is deliberate: gravitas comes from restraint, and
the association's authority is undermined, not enhanced, by decoration.

## Palette
The green is inherited from the parent body and is not up for debate. Everything else is chosen
to serve it.

```css
--ink:        #0B1F16;  /* text — near-black with a green cast, never pure #000 */
--nma-green:  #015B30;  /* primary. Inherited NMA green. Verify against the official crest. */
--green-deep: #013D20;  /* headers, footers, card ground */
--green-wash: #E8EFE9;  /* selected states, table stripes */
--paper:      #F6F7F5;  /* page ground — cool, not the warm-cream default */
--rule:       #D8DBD5;  /* hairlines, borders */
--harmattan:  #C9832B;  /* WARNING ONLY: dues overdue, strike notice, expiring listing */
```

Rules of use:
- `--harmattan` appears only where something is wrong or time-critical. If it becomes decorative,
  it stops working. This is the one accent and it is semantic, not aesthetic. A missing dues
  record is not a warning — the folio card's `dues not yet recorded` state (design.md §6) is
  visually identical to `active`, never harmattan, because the dues system not existing yet is
  not the member's fault.
- Verified status is communicated with `--nma-green`, never with a separate "success" colour.
- Every text/ground pair must clear WCAG 2.2 AA — 4.5:1 body, 3:1 large text. `--harmattan` on
  `--paper` does **not** pass for body text; use it for rules, icons and badges with dark text.

## Type
| Role | Face | Notes |
|---|---|---|
| Display | **Bricolage Grotesque** | Headlines only. Tight tracking, weight 600–700. Has enough character to not read as a template; institutional without being stuffy. |
| Body / UI | **IBM Plex Sans** | Designed for institutional systems. Highly legible at small sizes on cheap Android screens. |
| Data / folio | **IBM Plex Mono** | Folio numbers, receipt references, eyebrow labels, dates. Anything that is a *record* rather than prose. |

Three faces, hard limit. Subset and self-host the WOFF2 files — do not load webfonts from a
third-party CDN on a data-cost-sensitive site, and do not ship weights you don't use.

Scale: 12 / 14 / 16 / 18 / 21 / 28 / 38 / 52. Body 16px minimum, never smaller. Measure 60–72
characters. Line height 1.55 body, 1.1 display.

## Layout
- 4px spacing base. 8 / 12 / 16 / 24 / 40 / 64 for real spacing.
- Border radius 4px maximum. This is a register, not a consumer app. Cards are rectangles.
- Mobile-first single column; content max-width 68ch for prose, 1200px for the shell.
- The mono eyebrow + 3px green rule opens every section. That is the whole structural system.

## Motion
Restrained on purpose. Card flip on the folio card (the one moment of delight), 150ms opacity
and 2px translate on interactive elements, nothing else. No scroll-jacking, no parallax, no
entrance animations on content. Respect `prefers-reduced-motion` — and note that on a slow
Android device the fastest-feeling site is the one that doesn't animate.

## Photography
Real photographs of Gombe members, sessions and outreach only. No stock photography, ever.
A plain green panel with typography is more credible than a stock photo of a foreign doctor
holding a clipboard, and members will notice the difference immediately.
Duotone treatment in `--green-deep` unifies photos of wildly different quality — useful given
the source material will be phone photos from different years.

## Implementation
- Tokens in `app/globals.css` as CSS custom properties, mapped into `tailwind.config.ts`.
- **No raw hex values in components.** A hex literal in a `.tsx` file is a review rejection.
- Dark mode: not in Phase 1. Do it properly later or not at all; a half-done dark mode on a
  green-heavy palette looks broken.
