---
name: ship-check
description: Pre-merge verification for the NMA Gombe project — types, tests, rules, budget, accessibility, and data-protection paperwork. Run before every commit or PR.
---

# Ship check

Run in order. Report pass/fail per item, and do not report "done" with a failure outstanding.

```bash
npm run typecheck && npm run lint && npm run test && npm run test:rules && npm run analyze
```

Then verify by inspection:

1. Route JS ≤200KB gzipped. If it grew, name the dependency responsible.
2. Rules changed? A denial test exists for it.
3. New personal-data field? A row was added to `docs/08-NDPA-COMPLIANCE.md`.
4. Empty, error and offline states all render correctly.
5. Keyboard traversal works; focus is visible; contrast clears AA.
6. No raw hex values. No `any`. No personal data in logs or analytics.
7. Money is integer kobo. Amounts come from the server, never the client.
8. New copy is sentence case, active voice, no exclamation marks.
9. Lighthouse mobile ≥90 on the touched route, throttled to Slow 4G.

Finish with a one-line conventional commit message. Do not push without being asked.
