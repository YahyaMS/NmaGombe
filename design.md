# design.md — visual authority for NMA Gombe

This file contains **decisions**, not preferences. Every value here is final unless an ADR
supersedes it. Where you would normally choose, the choice has already been made — implement it
exactly. If a value is missing, that is a bug in this document: ask, do not improvise.

Product decisions live in `01-PRD.md`. Engineering conventions live in `CLAUDE.md`. This file
governs only what things look like and how they feel to touch.

---

## 1. The one idea

**Everything on this site is an entry in a register. One object is not.**

Nigerian medical practice runs on registers: the ward list, the theatre log, the roll of
members, the folio number that legally makes a doctor a doctor. That is the material this design
is made from — not "healthcare," not "editorial," not "premium."

So the entire site is built from **register rows**: full-width horizontal entries, a mono index
on the left, a hairline rule beneath, no box, no shadow, no background fill. Doctors, communiqués,
events, executives, payments, jobs — all the same row, tuned per content type.

The single exception is the **folio card**, which is a boxed, elevated, physical-feeling object.
It is the only element on the site permitted a shadow and the only one that looks like a card.
It earns that because it *is* a card.

**The compliance test, checkable in three seconds:** open any page. Count the boxed, elevated
surfaces. The answer must be zero, or one if the folio card is present. If you have built a grid
of three white rounded rectangles with shadows, you have built the generic thing and must delete
it.

This constraint is the design. Do not soften it because a section "needs visual interest."
Visual interest comes from typographic scale, photography and the rhythm of rules — not boxes.

---

## 2. Colour

Exact values. Verified contrast ratios in the table. Do not add a colour to this palette; do not
use a colour outside it.

```css
/* Ink */
--ink:              #0C1A13;  /* primary text — near-black, green-cast. Never #000. */
--ink-2:            #3D4A43;  /* secondary text, standfirsts */
--ink-3:            #5C6862;  /* metadata, timestamps, captions */

/* Institution */
--green:            #015B30;  /* inherited NMA green — primary action, links, verified state */
--green-deep:       #013A1F;  /* masthead, footer, folio card ground */
--green-press:      #01insert-on-implementation; /* see note below */
--green-wash:       #EAF0EB;  /* selected rows, active nav, subtle fills */

/* Ground */
--paper:            #FAFAF8;  /* page ground */
--surface:          #FFFFFF;  /* forms, sheets, the card face */
--rule:             #D9DDD7;  /* hairlines — the primary structural device */
--rule-strong:      #A9B2AC;  /* section rules, table headers */

/* Semantic — used only when something is true, never decoratively */
--harmattan:        #8A5312;  /* warning text: dues overdue, listing expiring */
--harmattan-wash:   #FBF1E3;  /* warning row ground */
--danger:           #9B2C1F;  /* destructive actions, failed payment */
```

`--green-press` is deliberately unset: derive it at implementation as `--green` at 92% lightness
in OKLCH and record the resulting hex here. Do not guess a value.

### Verified contrast (WCAG 2.2)
| Pair | Ratio | Verdict |
|---|---|---|
| `--ink` on `--paper` | 17.13 | AAA |
| `--ink-2` on `--paper` | 8.90 | AAA |
| `--ink-3` on `--paper` | 5.56 | AA body |
| `--green` on `--surface` | 8.27 | AAA |
| `--surface` on `--green` | 8.27 | AAA — white on green buttons pass |
| `--surface` on `--green-deep` | 12.91 | AAA — the masthead |
| `--green` on `--green-wash` | 7.15 | AAA |
| `--harmattan` on `--paper` | 6.04 | AA body |
| `--danger` on `--paper` | 7.24 | AAA |

Never use `#C9832B` or any lighter amber for text — it fails at 3.10 on white. Amber may only
appear as a rule, an icon, or a fill carrying dark text.

### The ratio rule — and why the usual advice is wrong here
Common guidance says brand colour should be 5–10% of the interface. That advice produces a site
that could belong to any organisation, which is the opposite of what an institution needs.

**Decision:** the masthead and the footer are solid `--green-deep`, full bleed, on every page.
Green is architecture here, not accent. The reading area between them is `--paper` and stays
overwhelmingly neutral. That combination — committed colour at the frame, near-total restraint
in the body — is what separates an institution from a SaaS product.

---

## 3. Type

Three faces, each with one job. Self-hosted WOFF2 subsets, Latin only. No CDN webfonts on a
data-cost-sensitive site.

| Role | Face | Job |
|---|---|---|
| Display / editorial | **Newsreader** (variable, optical size axis) | Headlines, standfirsts, article body, the hero |
| Interface | **IBM Plex Sans** | Navigation, buttons, forms, labels, dense UI |
| Record | **IBM Plex Mono** | Folio numbers, receipt references, register indices, eyebrows, amounts |

**Why a serif, and the risk.** The default of the moment is a geometric sans on white — Inter or
Geist, 16px, subtle borders. It is competent and it is what every AI-assisted site now looks
like. A serif with a genuine optical-size axis reads as considered rather than defaulted, and it
matches the documentary world this institution actually lives in. The risk is that a serif can
tip into "government gazette." It is held back from that by the mono record type, tight modern
tracking, and generous scale. If it reads as stuffy in the first build, the failure is in the
tracking and spacing, not the typeface — fix those before changing faces.

### Scale — exact, with tracking
Tracking tightens as size grows. This is the single most reliable signal of typographic
competence and it is absent from most machine-generated CSS.

| Token | Mobile | Desktop | Tracking | Line-height | Face |
|---|---|---|---|---|---|
| `display` | 34px | 56px | −0.022em | 1.05 | Newsreader 600 |
| `h1` | 27px | 40px | −0.018em | 1.12 | Newsreader 600 |
| `h2` | 22px | 30px | −0.014em | 1.20 | Newsreader 600 |
| `h3` | 19px | 23px | −0.010em | 1.30 | Plex Sans 600 |
| `body-lg` | 17px | 18px | −0.002em | 1.60 | Newsreader 400 |
| `body` | 16px | 16px | 0 | 1.60 | Plex Sans 400 |
| `small` | 14px | 14px | +0.002em | 1.50 | Plex Sans 400 |
| `eyebrow` | 11px | 12px | +0.08em | 1.00 | Plex Mono 500, uppercase |
| `folio` | 15px | 16px | +0.02em | 1.20 | Plex Mono 500 |

Body text never goes below 16px. Article measure is 62–68 characters. Nothing is centred except
the folio card contents and the verification page.

`font-variant-numeric: tabular-nums` on every number that sits in a column or changes in place:
amounts, dates, folio numbers, counts, receipt references. Non-negotiable — proportional figures
in a payment table is the tell that nobody looked.

---

## 4. Spacing, radius, elevation

### Spacing — six values, not twelve
```
xs   4px
sm   8px
md   16px
lg   24px
xl   48px
2xl  96px
```
A twelve-step scale is not a system, it is permission. Six values force rhythm because there is
no "slightly different" available. Section separation on desktop is `2xl`; on mobile it is `xl`.

### Radius — one value
```
--radius: 3px;
```
That is the whole radius system. Register rows have none. Avatars are circles. The folio card is
`8px` because a physical card has a larger corner — the only exception, and it is a physical
argument, not an aesthetic one.

### Elevation — one shadow
```css
--shadow-card: 0 1px 2px rgba(12,26,19,.06), 0 8px 24px -8px rgba(12,26,19,.18);
```
Used on the folio card and on modal sheets. Nothing else on the site casts a shadow. Structure
comes from `--rule` hairlines and whitespace.

---

## 5. The register row

The most-used component on the site. Get this right and most pages design themselves.

```
┌ (no box — this is a full-width row on --paper) ───────────────────────────┐
  NMA/GM/0417              Dr. Halima A. Bello                    [WhatsApp]
  ↑ mono, --ink-3          ↑ h3, --ink                             [Call]
                           Consultant Paediatrician
                           Federal Teaching Hospital Gombe
                           ↑ small, --ink-3
─────────────────────────────────────────────────────────── 1px --rule ────
```

Rules:
- Row padding: `md` vertical on mobile, `lg` on desktop. Full-bleed to the container edge.
- The hairline is on the row's bottom edge only. The last row in a group has no rule.
- Hover on desktop: ground shifts to `--green-wash`, 120ms. No lift, no scale, no shadow.
- Tap target minimum 48px. Actions are always reachable with the right thumb on mobile.
- The mono index on the left is the content's true identifier — folio number for a doctor, date
  for a communiqué, date for an event. If a content type has no natural identifier, it does not
  get an index; do not invent one.
- Rows never wrap into a grid. On desktop they get wider, not columnar.

**Every list on this site is register rows.** Directory, news, events, executives, payments,
jobs, verification queue, admin tables. One component, one rhythm, seven contexts.

---

## 6. The folio card

The hero object. Everything else on the site is subordinate to it, in the same way an Apple
product page is subordinate to the product shot. This is the artefact a doctor screenshots and
sends to a colleague, so it carries the institution's credibility on its own.

Build it at 2x and render it as an image for download. It must be legible at 320px wide and at
thumbnail size in a WhatsApp preview.

```
┌──────────────────────────────────────────────────┐  ground: --green-deep
│  [crest]   NIGERIAN MEDICAL ASSOCIATION          │  eyebrow, mono, white 70%
│            GOMBE STATE CHAPTER                   │
│                                                  │
│                                                  │
│  Dr. Halima Aminu Bello                          │  Newsreader 600, 24px, white
│  Consultant Paediatrician                        │  Plex Sans, 14px, white 75%
│                                                  │
│  FOLIO                    DUES              ┌──┐ │  eyebrow, mono, white 55%
│  NMA/GM/0417              2026              │QR│ │  folio token, white
│                                             └──┘ │
└──────────────────────────────────────────────────┘
```

- Aspect ratio 1.586 (ISO/IEC 7810 ID-1 — a real card, because it is one). Radius 8px.
- The crest is the only image. No portrait in v1: photo quality across the roster will be
  inconsistent, and one bad portrait makes the whole system look cheap. Revisit when there is a
  controlled capture process.
- QR quiet zone is a minimum of 4 modules on white. Never place the QR on green.
- Motion: the card flips to the reverse on tap, 450ms, `cubic-bezier(.2,.8,.2,1)`. **This is the
  only expressive animation on the entire site.** Spend the boldness here and nowhere else.
- States, all of which must be designed before implementation: `loading` (skeleton at exact card
  dimensions, no shift), `active`, `pending verification` (card is `--rule-strong` ground, not
  green — an unverified card must never look official), `dues outstanding` (a `--harmattan`
  bar across the foot, dues year struck through), `dues not yet recorded` (the dues system
  doesn't exist yet — this is not the member's fault and must not look like it is. Neutral:
  `--green-deep` ground exactly as `active`, no `--harmattan`, no strike-through, the dues line
  is simply absent. A brand-new verified member's card must never render a warning about money
  the chapter hasn't even started collecting), `offline` (rendered from cache, with a mono line
  reading the sync date), `failed`.

---

## 7. Optical corrections

This is where "a person designed this" actually lives. None of it is visible individually; all of
it is visible in aggregate.

1. **Tracking by size** — implemented in the scale above. Apply it; do not let a component
   override it.
2. **Optical alignment, not box alignment.** The mono index, bullets, and quote marks hang
   *outside* the text block's left edge so the text's optical edge stays straight.
3. **Icon and label alignment is cap-height based**, not bounding-box based. An icon centred to
   the line box sits visibly low next to text; nudge it up 1px and check at 16px.
4. **Button label optical centring.** A button with a trailing icon needs 1–2px less padding on
   that side or it reads off-centre. Check every icon button.
5. **Tabular figures everywhere numbers change or align.** See §3.
6. **Hairlines are `--rule` at 1px, never `#000` at low opacity.** Opacity-based rules pick up
   the ground colour and go muddy over photography.
7. **No pure black, no pure white in large fields.** `--ink` and `--paper` exist for this reason.
8. **Photographs are duotoned to `--green-deep`** at 92% and lifted 4% in the shadows. The
   source material will be phone photos from a decade of different cameras; duotone is what makes
   an inconsistent archive look like one system. This is a requirement, not a style.
9. **Reserve aspect ratio on every image.** Zero cumulative layout shift is a design rule here,
   not just a performance one — content that jumps reads as untrustworthy.
10. **Optical size axis on Newsreader** — set it to match the rendered size. It is the reason the
    typeface was chosen; leaving it at default wastes the choice.

---

## 8. Motion

One expressive moment (the card flip, §6). Everything else is functional and fast.

```
--motion-fast:     120ms   /* hover, focus, ground shifts */
--motion-standard: 200ms   /* sheets, disclosure, tab change */
--motion-emphasis: 450ms   /* the card flip. Nothing else. */
```
Ease-out entering, ease-in exiting. No scroll-triggered reveals, no staggered cascades, no
parallax, no entrance animation on content — on a mid-range Android over slow data, the fastest
site is the one that does not animate. `prefers-reduced-motion` disables the flip (cross-fade
instead) and all transitions.

**The design must be equally good with every animation removed.** If a page depends on motion to
feel considered, the layout is wrong.

---

## 9. Photography

- Real Gombe photographs only. No stock, no illustration of doctors, no 3D, no AI imagery.
- Duotone per §7.8, applied uniformly.
- Crop aggressively and asymmetrically. Faces cropped at the frame edge read as editorial;
  centred, fully contained portraits read as a stock library.
- If no suitable photograph exists, use a typographic panel on `--green-deep` — never a
  placeholder image, never an icon standing in for a photo.
- One photograph per viewport, maximum. Photography carries weight only when it is scarce.

---

## 10. Page-level decisions

**Homepage.** Logged out: a display-scale statement of what the chapter is, one photograph, and
two actions — *Find a doctor* (primary) and *Member sign in*. Below it, the single latest
communiqué as a register row — absent entirely, not empty, when nothing is published — and
nothing else. **No feature grid, ever, on this side of the page.**

Logged in as a verified member: the folio card section shows the visitor's own real card in
place of the demo card, "Go to your portal →" in place of "Get verified →"; falls back to the
demo card silently if the card fetch fails. Below that, a "Your shortcuts" register-row list to
every `/portal` feature (directory, CPD, jobs, guidelines, welfare, profile) — added because a
member landing on `/` instead of `/portal` had no way to reach anything from here except that one
"Go to your portal" link. This is not the feature grid the rule above forbids: it's the same
register-row navigation `PortalDashboard.tsx` already uses, renders only for a signed-in member,
and carries no promotional framing — a functional shortcut list, not marketing. Same URL,
different job either way.

Scoped down from an earlier version of this spec, which additionally described a plural list of
communiqués, dues status beneath the logged-in card, and the directory search field as the first
interactive element for a logged-in visitor. None of those three shipped — dues status has no
data source at all now (Version 3, no CAC registration — ADR-021), and the other two were simply
out of scope for that slice. Revisit deliberately, not by drifting back toward this paragraph's
old wording.

**Directory (the anchor).** Search field is the first thing on the page and is focused on desktop
load. Results are register rows. Filters are a bottom sheet on mobile, an inline row on desktop —
never a left sidebar. Instant local filtering against the offline cache; a spinner on keystroke
means the query is wrong. Empty state names the cause and offers *Clear filters*. Offline state
reads as freshness ("Last synced Tuesday, 09:14"), not as failure.

**Verification page (`/verify/[token]`).** The most austere page on the site, and the one the
public judges the institution by. Centred, `--paper`, a single statement — verified or not —
name, grade, facility, folio, status year. No navigation, no footer links, no marketing. Nothing
else exists on this page. Same trap as the folio card: until dues collection exists, "status
year" has no real value to show. A verified member reads as "Verified member of NMA Gombe" with
no year claimed, never as lapsed or outstanding — the same `dues not yet recorded` honesty
applies here.

**Dues.** Boring on purpose. Amount shown before any button. One primary action. Confirmation
states the amount, the year covered and the reference in tabular figures. Receipt is downloadable
and legible in greyscale, because someone will print it.

**Admin.** Same register rows, higher density (`sm` padding), keyboard-first. The verification
queue must be operable one-handed on a phone — approve and reject are the only two primary
actions and they sit within thumb reach. If the Secretary cannot clear ten submissions in two
minutes standing in a corridor, this screen has failed regardless of how it looks.

---

## 11. Content design

Sentence case everywhere. Active voice. No exclamation marks. The verb on the control is the verb
in the confirmation: *Pay dues* → *Dues paid*.

Errors state what happened and what to do, in the interface's voice. They do not apologise and
they are never vague. "That folio number isn't on the chapter roster. Check it, or contact the
secretariat." — not "Oops! Something went wrong."

Empty states name the cause and offer the next action. **A module with no data does not render an
empty box — it does not render.** The parent association's homepage prints "No event found!"
under a heading; that single detail undoes more credibility than any amount of good design
recovers.

Never invent statistics, testimonials, member counts, or "trusted by" claims. Every number on
this site must be traceable to a real record.

---

## 12. The forbidden defaults

Short list, because a long list of prohibitions just describes a safe average — and the safe
average *is* the current machine aesthetic. These five are the actual tells:

1. **A grid of three rounded, shadowed cards.** Covered by §1. Zero boxes, or one.
2. **Everything at 12–16px radius.** Radius is 3px. It is a constant, not a decision.
3. **A geometric sans on white with subtle grey borders and a single accent colour.** This is
   what "clean and modern" now means by default, and it is why every new site looks identical.
4. **Gradients, glassmorphism, glows, blobs, floating shapes, oversized decorative icons.**
   Nothing on this site has a gradient.
5. **Scroll-triggered entrance animations.** Nothing fades up as you scroll.

Beyond these, judge by §13 rather than by a checklist.

---

## 13. The only review test that matters

**Screenshot any page. Remove the crest and the word "Gombe." Could this be any other
organisation's website?**

If yes, the page has failed, and no amount of spacing polish will fix it. The identity has to be
carried by the register rows, the committed green frame, the serif-plus-mono pairing and the
folio card — structural things that survive a crop — not by a logo in the corner.

Secondary checks, in order:
1. Boxed elevated surfaces: zero, or one.
2. Is the primary action obvious in under three seconds, on a 320px screen?
3. Does every number use tabular figures?
4. Does the page look right with all animation disabled? With images not yet loaded?
5. Does every empty module disappear rather than render blank?
6. Contrast verified against §2, not eyeballed.
7. Can the primary task be completed one-handed?

---

## 14. Implementation notes for Claude Code

- Tokens as CSS custom properties in `app/globals.css`, mapped into `tailwind.config.ts`. **No
  raw hex, rgb, or arbitrary spacing value in any component.** A hex literal in a `.tsx` file is
  a review rejection.
- Build the register row and the folio card as primitives before any page. They are the system;
  the pages are arrangements of them.
- Ship the type scale with its tracking values as a single utility set. Do not let components set
  their own `letter-spacing`.
- Dark mode is out of scope. A half-done dark mode on a green-heavy institutional palette looks
  broken, and there is no member need for it.
- If a request in this document conflicts with `01-PRD.md`, `03-DATA-MODEL.md` or the security
  rules, the conflict is flagged and not implemented. Design never overrides privacy.
- Where this document is silent, ask. It is silent deliberately — an unspecified value means the
  decision has not been made, not that you should make it.
