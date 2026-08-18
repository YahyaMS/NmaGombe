# 06 — Roadmap

Ship in vertical slices that a real member can use. Never a "foundations sprint" with nothing
to show — a volunteer project loses momentum the moment there is nothing to demonstrate.

## Phase 0 — Foundations (target: 1 week)
Repo, CI, tokens, Firebase projects, emulators, rules test harness, PWA shell, a real page
using real content. Ends with the public homepage and `/about` deployed on the real domain.

**Acceptance:** the URL is live, Lighthouse mobile ≥ 95, and the Secretary has seen it.

## Phase 1 — MVP: identity + directory + dues (target: 4–6 weeks)
The anchor. In build order:
1. Auth + signup + folio submission + `/pending`.
2. `/admin/verification` — build this *before* the directory. If approvals are slow, nothing
   downstream works.
3. Seed `directoryEntries` from the roster so the directory is useful on day one for the first
   member who logs in. **An empty directory kills the launch.** Seed it, marked "not yet
   claimed," and let members claim their own entries.
4. Directory search + one-tap WhatsApp + offline cache.
5. Folio card + QR + `/verify/[folio]`.
6. Dues: rates, Paystack init, webhook, receipt, Treasurer's ledger export.
7. News + events publishing, three fields, phone-friendly.

**Acceptance:** the Treasurer collects real dues from a real member and reconciles it unaided;
a member finds a colleague in another specialty and reaches them in two taps, on aeroplane mode.

**Launch plan:** announce in the chapter WhatsApp groups with a screenshot of the folio card.
Not email. Not a press release. Ask ten trusted members to sign up in the first 48 hours so the
directory has real entries before the broad announcement.

## Phase 2 — Stickiness (target: 6–8 weeks, only after Phase 1 metrics are met)
- CPD/CME log + certificate storage + export summary for renewal season.
- Event registration with attendance-linked CPD credit — the loop that makes chapter CME
  measurably more valuable than any other CME the member could attend.
- Jobs/locum board with compulsory expiry.
- Welfare fund information + case-opening form (exec-only viewer).
- Clinical guideline repository, offline-cached.
- Scheduled reminders: dues cycle, MDCN renewal month, upcoming events.

**Do not start Phase 2 until ≥ 30% of the roster is verified.** Building more features for an
empty portal is the most expensive way to fail.

## Phase 3 — Only with a written mandate
- E-voting / AGM tooling. High political risk; a disputed result blamed on the site ends the
  project. Requires exec mandate in writing and an independent audit trail.
- React Native companion app on the same Firebase backend.
- Chapter journal / publications archive.
- Mentorship matching, equipment classifieds, sponsorship.

## Risks, ranked by likelihood of killing this
| Risk | Mitigation |
|---|---|
| **Content decay** — nobody posts after month two | Automate everything that can be automated. Manual surface is deliberately three forms. The site must look correct with no new content for six months: no "Latest news" module that renders an empty box, no dated "Upcoming events" widget that says "No event found." (Exactly the failure visible on the parent site.) |
| **Verification queue neglect** | Two named approvers, WhatsApp alert on new submission, and a visible SLA on `/pending`. Track queue age on `/admin`. |
| **Empty directory at launch** | Seed from the roster before announcing. Claim-your-entry flow. |
| **Paystack account can't be opened** | Resolve intake item 5 before designing the dues UI. Fallback: bank-transfer instructions plus manual admin marking, same ledger. |
| **Volunteer burnout** | The Secretary's whole job is three forms on a phone. Anything that needs a laptop won't happen. |
| **Exec turnover loses the keys** | Chapter-owned email, shared vault, written handover doc, domain paid from a budget line. |
| **Directory scraped** | App Check, verified-only access, per-field visibility, rate-limited search, no bulk endpoint. |
| **Reputational incident** — wrong medical info published | Only communiqués and guideline links; no original clinical advice content in Phase 1. |
