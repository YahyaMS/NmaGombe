---
name: feature-slice
description: Plan and build one vertical feature slice for the NMA Gombe portal — data model, rules, Function, UI, tests — in the correct order. Use when starting any new feature.
---

# Feature slice

Build features as vertical slices a real member can use. Never a horizontal layer.

Work in this order and stop for review after step 2:

1. **Restate the member's job.** One sentence: "A <persona> needs to <do X> so that <Y>."
   If you cannot name the persona from `docs/01-PRD.md`, the feature is not justified — say so
   instead of building it.
2. **Plan.** Documents touched, rules changed, Functions needed, routes added, offline
   behaviour, and what could leak. Show this and wait.
3. Data model → update `docs/03-DATA-MODEL.md`.
4. Security rules → plus rules unit tests asserting denial.
5. Cloud Function if server trust is involved, with its own authorisation check.
6. UI, mobile-first, tokens only.
7. Empty state, error state, offline state. All three, or the slice is not done.
8. Update `docs/05-ROUTES.md`; add a row to `docs/08-NDPA-COMPLIANCE.md` if any personal-data
   field was added.
9. Run `/ship-check`.
