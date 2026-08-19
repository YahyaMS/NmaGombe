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

---
## ADR-009 — One Firebase project (`nma-gombe-c5a9d`), not dev/prod split
**Context.** `docs/00-INTAKE.md` item 75 recommends two projects, `nma-gombe-dev` and
`nma-gombe-prod`, so local and emulator work can never touch real member data. As a
volunteer-run project standing up its first Firebase project, the overhead of provisioning,
billing, and keeping two projects' rules/indexes in sync outweighs the risk today.
**Decision.** A single project, `nma-gombe-c5a9d`, used for both local development and
production. `.firebaserc` has one `default` alias. Local development still uses the Firebase
emulators (`NEXT_PUBLIC_USE_EMULATORS=true`) — the single project is never targeted directly
from a dev machine.
**Consequence.** Simpler setup now, but every emulator-bypassing script (seeding, admin CLI
runs, manual Firestore console edits) is touching the *only* copy of real member data — there
is no throwaway environment. Revisit before Phase 1 auth/dues go live with real members: at
minimum, add a second project before the roster is seeded for real, so seed-directory dry-runs
and rules changes have somewhere safe to land first.

---
## ADR-010 — Email-link sign-in, superseding ADR-007's phone-OTP-primary
**Context.** ADR-007 chose phone OTP as primary sign-in. In practice this needs the Blaze
billing plan for SMS before a single member can sign up, adding a billing decision to the
critical path of the very first slice. The chapter would rather defer that decision.
Separately, the roster document actually in hand (`docs/GOMBE NMA 2025 2026 VOTERS ELIGIBILITY
LIST UPDATED LATEST.xlsx`) turned out to be a dues-arrears/voting-eligibility ledger — names and
monthly payment status only, no folio numbers, specialty, or phone — so automated folio-number
matching against a roster was never buildable for this slice regardless of auth method.
**Decision.** Email-link (passwordless) sign-in via Firebase Auth's
`sendSignInLinkToEmail`/`signInWithEmailLink`, confirmed against current Firebase docs to need
no Dynamic Links dependency for a web app and to run on the free Spark plan. Folio-number
verification is manual: the member self-reports a folio number at signup, and an admin approves
by matching the submitted name against the eligibility list plus their own knowledge of the
membership — there is no automated cross-check. `emailLinkAttempts` rate-limits the send, same
spirit as ADR-007's OTP caps.
**Consequence.** Phone OTP is not gone — `docs/05-ROUTES.md`'s `/signin` still describes it as
a fallback, and ADR-007's SMS-cost-control reasoning still applies whenever it's built. But it
is no longer the thing gating the first signup, and this project stays on Spark through
identity, verification, and directory (build-order steps 1–5). Cost: email deliverability in
Nigeria is less reliable than SMS for some providers, and a lost/misspelled email address has no
retry path as cheap as re-sending an SMS. Revisit if signup completion rates suffer for it.

---
## ADR-011 — Known issue: Firebase Auth+Firestore alone exceeds the 200KB route budget
**Context.** Building `/signup` and `/pending` (the first client routes to actually use Firebase
Auth and Firestore) surfaced that the SDK itself — just `firebase/auth` + `firebase/firestore`,
correctly imported via their scoped submodules, nothing extraneous — is ~211KB gzipped. That
alone exceeds the ≤200KB-per-route budget in `CLAUDE.md` before any app code is counted. This
isn't a bug in either route's imports; it's the real, measured cost of the SDK (confirmed by
inspecting the shipped chunk directly — it's the genuine browser WebChannel Firestore build, not
a resolution bug pulling in the Node/gRPC variant). Since every authenticated Phase 1 route
(directory, folio card, dues, admin) will touch Firestore on the client the same way, this is a
structural conflict between ADR-002 (Firebase) and the budget in `CLAUDE.md`/`01-PRD.md`, not
something specific to this slice.
**Decision.** Ship Phase 1 build-order steps 1–5 with the overage. No real users yet, so the cost
of shipping over budget now is low. **This must be resolved with a dedicated bundle pass before
launch** — candidates to evaluate then: `firebase/firestore/lite` for routes that don't need
realtime `onSnapshot` (trades away live-updating UI for a much smaller REST-based client),
deferring Firestore's load until after first paint on routes where that's honest (not `/pending`,
which needs it immediately), or revisiting whether the 200KB budget should apply uniformly to
public marketing routes and the auth-gated portal alike.
**Consequence.** `/pending`'s bundle shows the true ~211KB cost in Next's own "First Load JS"
metric. `/signup`'s doesn't — its Firebase usage sits behind a `next/dynamic(..., { ssr: false })`
boundary added to fix a hydration-mismatch issue, which incidentally moves the cost out of that
metric. This is not a real saving: a member still downloads the same bytes within moments of
opening the page. Don't read `/signup`'s clean bundle number as evidence the budget problem is
solved — check `/pending`'s instead, or measure real transferred bytes, not the official metric.
