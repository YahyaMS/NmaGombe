# 06 — Roadmap

Ship in vertical slices that a real member can use. Never a "foundations sprint" with nothing
to show — a volunteer project loses momentum the moment there is nothing to demonstrate.

## Phase 0 — Foundations (target: 1 week)
Repo, CI, tokens, Firebase projects, emulators, rules test harness, PWA shell, a real page
using real content. Ends with the public homepage and `/about` deployed on the real domain.

**Acceptance:** the URL is live, Lighthouse mobile ≥ 95, and the Secretary has seen it.

## Phase 1 — MVP: identity + directory (target: 4–6 weeks)
The anchor. Dues was originally build-order step 6 here — moved to Version 3, unscheduled; see
`docs/09-DECISIONS.md` ADR-021. In build order:
1. Auth + signup + folio submission + `/pending`.
2. `/admin/verification` — build this *before* the directory. If approvals are slow, nothing
   downstream works.
3. `directoryEntries` populate automatically the moment `decideVerification` approves someone —
   see ADR-012 (the roster in hand has no specialty/facility/folio to seed a useful placeholder
   with, and the built verification flow has no "claim" step). **An empty directory still kills
   the launch** — this just means real verified members, not pre-seeded placeholders, are what
   fills it. Get verification moving early so it isn't empty at announcement.
4. Directory search + one-tap WhatsApp + offline cache.
5. Folio card + QR + `/verify/[token]`.
6. News + events publishing, three fields, phone-friendly.

**Acceptance:** a member finds a colleague in another specialty and reaches them in two taps, on
aeroplane mode.

**Launch plan:** announce in the chapter WhatsApp groups with a screenshot of the folio card.
Not email. Not a press release. Ask ten trusted members to sign up in the first 48 hours so the
directory has real entries before the broad announcement.

## Phase 2 — Stickiness (target: 6–8 weeks, only after Phase 1 metrics are met)
- CPD/CME log + certificate storage + export summary for renewal season.
- Event registration with attendance-linked CPD credit — the loop that makes chapter CME
  measurably more valuable than any other CME the member could attend.
- Jobs/locum board with compulsory expiry.
- Welfare fund information + case-opening form (exec-only viewer). Built — `/portal/welfare`,
  `/admin/welfare`. Real eligibility/coverage copy still not supplied (`docs/00-INTAKE.md` item
  24); the info panel ships as a marked placeholder until it is.
- Clinical guideline repository, offline-cached.
- Scheduled reminders: MDCN renewal month, upcoming events. Both ship an in-app urgency
  treatment on `/portal` (`--harmattan` inside the renewal month / last 3 days) — not a push,
  email, or WhatsApp nudge; nothing "scheduled" runs, it's computed on every visit. (Dues-cycle
  reminder dropped along with dues itself — Version 3, ADR-021.)

**Do not start Phase 2 until ≥ 30% of the roster is verified.** Building more features for an
empty portal is the most expensive way to fail.

## Phase 3 — Only with a written mandate
- E-voting / AGM tooling. High political risk; a disputed result blamed on the site ends the
  project. Requires exec mandate in writing and an independent audit trail.
- React Native companion app on the same Firebase backend.
- Chapter journal / publications archive.
- Mentorship matching, equipment classifieds, sponsorship.

## Version 3 — unscheduled, different kind of blocker than Phase 3
Not gated on a written mandate like Phase 3 above — gated on something outside this project's
control entirely, with no visible timeline:
- **Dues payment** (rates, Paystack init, webhook, receipts, ledger export, and every route that
  depends on it). Blocked on the chapter having no CAC registration, a legal prerequisite for a
  Nigerian payment gateway merchant account — confirmed 2026-08-27, only the parent national
  association is CAC-registered. `docs/09-DECISIONS.md` ADR-021. Revisit only if that changes;
  do not build toward it or word anything as "coming soon" until it does.

## Risks, ranked by likelihood of killing this
| Risk | Mitigation |
|---|---|
| **Content decay** — nobody posts after month two | Automate everything that can be automated. Manual surface is deliberately three forms. The site must look correct with no new content for six months: no "Latest news" module that renders an empty box, no dated "Upcoming events" widget that says "No event found." (Exactly the failure visible on the parent site.) |
| **Verification queue neglect** | Two named approvers, WhatsApp alert on new submission, and a visible SLA on `/pending`. Track queue age on `/admin`. |
| **Empty directory at launch** | Seed from the roster before announcing. Claim-your-entry flow. |
| **Dues payment indefinitely blocked** | Confirmed, not hypothetical — no CAC registration, no Paystack merchant account path. Deferred to Version 3 rather than designed around; see ADR-021. No fallback (bank-transfer/manual marking) is being built either, since that's still designing toward a feature that isn't scheduled. |
| **Volunteer burnout** | The Secretary's whole job is three forms on a phone. Anything that needs a laptop won't happen. |
| **Exec turnover loses the keys** | Chapter-owned email, shared vault, written handover doc, domain paid from a budget line. |
| **Directory scraped** | Verified-only access, per-field visibility, no bulk endpoint — all built and tested, see `03-DATA-MODEL.md`'s threat-model table. **Not yet true:** rate-limited search (no rate limiting exists anywhere in this codebase, on any endpoint) and App Check enforcement (client-wired, enforced once, rolled back the same day after a real production failure). Both tracked, neither is a live control today — see `09-DECISIONS.md` ADR-020 and `03-DATA-MODEL.md`. |
| **Reputational incident** — wrong medical info published | Only communiqués and guideline links; no original clinical advice content in Phase 1. |
| **Bundle budget** — Firebase Auth+Firestore alone (~211KB gzipped) exceeds the 200KB/route budget on every authenticated route | Known and accepted through build-order steps 1–5; must be resolved with a dedicated bundle pass before launch. See `09-DECISIONS.md` ADR-011. |
