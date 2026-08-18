---
description: UI and copy conventions for components and pages
globs: ["app/**", "components/**", "*.css", "tailwind.config.ts"]
---

# Building UI

- **No raw hex, rgb, or arbitrary spacing values.** Design tokens only. See
  `docs/04-DESIGN-SYSTEM.md`. A hex literal in a component is a review rejection.
- Server Components by default. Add `"use client"` only when interaction requires it, and push
  it as far down the tree as possible.
- Bundle budget is ≤200KB gzipped JS per route. Before adding any dependency, state its
  transfer cost and what it replaces. Prefer 30 lines of our own code over a 40KB package.
- `--harmattan` (the amber accent) appears only for warnings and time-critical states. Never
  decoratively.
- **Every module must render correctly when its data is empty** — which usually means not
  rendering at all. Never an empty panel, a zero counter, or "No events found."
- Radius 4px maximum. Motion: 150ms, opacity and small translate only, `prefers-reduced-motion`
  respected. The folio card flip is the single exception.
- Copy: sentence case, active voice, plain verbs, no exclamation marks. The verb on the button
  matches the verb in the confirmation ("Pay dues" → "Dues paid"). Errors say what happened and
  what to do; they do not apologise.
- Photography: real Gombe photographs only. If none is available, use a typographic panel.
  Never stock photography.
- Minimum 16px body text. Test at 320px width. Visible keyboard focus on everything interactive.
