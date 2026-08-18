# 09 — Architecture decision record

Append-only. Each entry: context, decision, consequence. If you want to reverse one, add a new
ADR that supersedes it — don't edit history.

---
## ADR-001 — Next.js App Router, not a React SPA or Astro
**Context.** Public pages need search visibility and fast first paint on expensive mobile data.
The member portal needs genuine interactivity and offline behaviour.
**Decision.** Next.js App Router with React Server Components for public routes and client
components for the portal.
**Consequence.** One framework, one deploy. Rejected: a plain React SPA (invisible to search,
heavier bundle) and Astro (lighter for content but the portal is more application than document,
and two frameworks doubles the maintenance burden on a volunteer-run project).

---
## ADR-002 — Firebase, with eyes open about Supabase
**Context.** Existing team fluency is Firebase. A React Native app is likely later. Connectivity
in Gombe is intermittent.
**Decision.** Firebase: Auth, Firestore, Functions, Storage, App Check.
**Consequence.** Best-in-class offline persistence and a shared backend for the future mobile
app. The honest cost: authorisation is split across Firestore rules *and* Admin-SDK checks inside
Functions, which is two places to get it wrong. Supabase's Postgres Row-Level Security is a
better access-control model for exactly this shape of problem. Revisit if rule complexity or
Firestore read costs become the bottleneck; do not revisit on aesthetic grounds mid-build.

---
## ADR-003 — We do not touch MDCN licence renewal or payment
**Context.** MDCN operates its own licence-renewal portal with its own payment and receipt flow.
Duplicating it would mean holding stale fee tables, taking on money we have no authority over,
and being blamed when someone's licence lapses.
**Decision.** No MDCN fees, no MDCN payment flow, no fee tables. We store a member-entered
renewal month, send a reminder, and deep-link to the MDCN portal.
**Consequence.** We keep the useful 5% (the reminder) and shed all the liability. Note the
follow-on effect: this removed what was originally going to be the MVP anchor feature, which is
why the anchor is now the member directory (see `01-PRD.md`).

---
## ADR-004 — No forum, no in-app chat
**Context.** Association-sector research says online community is highly valued by members. In
this specific context, WhatsApp already provides it and has total penetration among Nigerian
doctors.
**Decision.** No forum, no chat, no message board. Integrate with WhatsApp via click-to-chat and
broadcast instead.
**Consequence.** We avoid building a ghost town. Sector benchmarks that recommend online
community are drawn largely from US associations without a dominant incumbent messaging channel;
they do not transfer here. Revisit only if WhatsApp broadcast reach measurably fails.

---
## ADR-005 — Custom Firestore admin, not a headless CMS
**Context.** The Secretary needs to publish news, events, and approve members — from a phone,
in a few minutes, occasionally.
**Decision.** Purpose-built admin forms writing to Firestore. No Sanity, Strapi, Payload,
Contentful or WordPress.
**Consequence.** No second system, no second bill, no upgrade treadmill, and the admin UI can be
built for the three tasks that actually occur rather than for general-purpose editing. Cost: we
own the editor. Acceptable — it is three forms. If the chapter later hires an editorial team,
Sanity is the reconsideration candidate.

---
## ADR-006 — Directory contact details are behind verification, always
**Context.** A verified list of doctors with phone numbers is a commercially valuable asset and
an NDPA liability.
**Decision.** Public `/doctors` shows name, specialty and facility only. Contact details require
`verified: true` and are opt-in per field by each member.
**Consequence.** The public gets a credible find-a-doctor tool; members' phone numbers do not
become a recruiter's product. This line is not negotiable for convenience.

---
## ADR-007 — Phone OTP primary, email secondary — with a cost cap
**Context.** Nigerian doctors reliably have phone numbers; email addresses are often stale.
**Decision.** Phone OTP is the primary sign-in. Hard per-number and per-day OTP caps from day one.
**Consequence.** Better completion rates. SMS verification is billed per message and is the most
likely line item to surprise the budget, so the caps are a cost control, not just anti-abuse.

---
## ADR-008 — Firestore region: europe-west1
**Context.** Firestore requires a region to be chosen at project creation. Google Cloud has no
African region as of August 2026. Data sovereignty under NDPA 2023 is a consideration, but the
Act does not prohibit cross-border transfers — it requires they be documented and that the
processor provides adequate protection (see docs/08-NDPA-COMPLIANCE.md §3).
**Decision.** `europe-west1` (Belgium). It is the closest Google Cloud region with a proven
multi-region Firestore offering and the lowest measured latency from Lagos/Abuja. Not Africa,
but not the US either — materially closer and GDPR-regulated infrastructure.
**Consequence.** All member data physically resides in Belgium. This must be disclosed in the
privacy notice (`/privacy`) and recorded in the processor table in 08-NDPA-COMPLIANCE.md. If
Google opens an African region while the project is live, migration is a separate ADR decision —
Firestore region cannot be changed after project creation without a full export/import.
