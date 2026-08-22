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

**Update, `/portal/cpd` (Phase 2, first slice built after this ADR).** Measured directly (gzipping
each route's actual first-load chunks, since Turbopack's build output doesn't print a size table
the way webpack's did): every authenticated portal route — `/portal`, `/portal/card`,
`/portal/directory`, `/portal/profile`, `/admin` — is already at ~374–376KB gzip, not just
`/pending`'s ~211KB; the overage is uniform across the portal, not a `/pending`-specific number.
`/portal/cpd` lands in the same band (~375.7KB), and its own marginal cost above the next-closest
route is under 1KB — confirming the overage here is entirely the shared SDK cost this ADR already
tracks, not a new dependency this slice introduced. One candidate mitigation above is now
partially foreclosed for this route specifically: `/portal/cpd` deliberately uses `onSnapshot`
rather than a one-time `getDocs()`, because `getDocs()` "may return cached data or fail" while
offline per `@firebase/firestore`'s own type docs — not a reliable guarantee, and "offline for the
things that matter" is a `CLAUDE.md` non-negotiable. Moving this route to `firebase/firestore/lite`
during the eventual bundle pass would trade away that offline guarantee, not just save bytes;
whoever does that pass should treat it as a real design trade-off for this route, not a free win.

---
## ADR-012 — directoryEntries populate on verification, not from a pre-seeded roster
**Context.** `06-ROADMAP.md`'s original step 3 assumed pre-seeding `directoryEntries` from the
roster as unclaimed placeholders, with members claiming their entry during signup. The roster
actually in hand (`data/roster-2025-2026.xlsx`) is a dues-eligibility ledger — names and payment
status only, no department, facility, or folio number — so there's nothing to pre-populate a
useful entry with. The signup/verification flow already built (ADR-010, `decideVerification`)
also has no "claim" step: it's fresh signup → admin approves by name-match, not roster-match.
**Decision.** `decideVerification` writes `directoryEntries/{uid}` itself at the moment of
approval, projected from the member's own submitted fields through their visibility flags — no
separate seed script, no unclaimed-placeholder state.
**Consequence.** The directory is empty until real members actually verify, not populated on day
one the way the roadmap originally described — a slower start, but every entry is real data from
a real approved member rather than a bare name waiting to be claimed. If a richer roster (with
department/facility/folio) turns up later, a seed script remains a reasonable fast-follow;
nothing here forecloses it.

---
## ADR-013 — Public directory is a separate collection, read server-side only
**Context.** `/doctors` (public) and `/portal/directory` (member-only) are two audiences with
different fields. `directoryEntries` (ADR-012) is correctly member-gated
(`allow get, list: if verified()`), but a public find-a-doctor page needs some of the same data
reachable by nobody-signed-in. One collection with a looser rule risks exposing contact details
if that rule is ever widened by mistake; a public `allow list: if true` on any directory-shaped
collection also hands anyone with a browser console the complete roster of every doctor in Gombe
State and their facility in a single query — exactly the scraping risk `03-DATA-MODEL.md`'s
threat model warns about, even though `directoryEntries` itself never carries contact fields
unless a member opted in.
**Decision.** A separate `publicDirectory/{uid}` collection carrying `displayName`, `department`,
`facility?`, `town?`, `folioNumber`, `searchTokens` and nothing else. Contact fields are never
written there by any code path, so there is nothing to accidentally expose. Rules are
`allow read, write: if false` — no client access at all, identical in effect to the default-deny
catch-all today since nothing targets this path yet, but stated explicitly so a future rules
change can't accidentally widen it without touching this line. `/doctors` reads it via the Admin
SDK from a Server Component, never the client SDK (`lib/data/publicDirectory.ts`).
**Consequence.** No public database endpoint to enumerate; rate limiting and caching move to the
edge layer (Next.js/hosting) where we actually control them, not to Firestore rules. Specialty
filtering is a server-computed, plain-link filter over the fetched list (no client JS, no
per-keystroke Firestore query — see `/doctors`'s implementation). Separately: listing on a
public, indexable page required member consent, which the exec has since ratified (Readiness
Register item 10; `00-INTAKE.md` item 25 — cleared). `onMemberWrite`
(`functions/src/directory-projection.ts`, ADR-014) writes to `publicDirectory` only once
`members.publicListingConsent === true`, default `false` — so the public directory stays empty
per-member until that member actually opts in, even though the route and projection are both
now built. This ADR's schema reservation; see `03-DATA-MODEL.md` for the field list.

---
## ADR-014 — Specialty captured at signup; directory projection moves to a write trigger
**Context.** Both directories and the folio card need specialty (`department`), and
`/admin/verification` is more useful if the reviewer sees it next to the folio number as a
cross-check against the eligibility list, not just a bare number. Deferring specialty to
`/portal/profile` means it only arrives from the fraction of members who return to fill in a
form after already getting what they came for — self-selecting and small. Members are most
motivated at the moment they're signing up and waiting on approval. Separately, once
`/portal/profile` makes `department`, `grade`, `facility` and the rest editable after
verification, `decideVerification` writing `directoryEntries`/`publicDirectory` only at the
moment of approval (ADR-012, ADR-013) means a later profile edit would silently go stale in both
— a real data-consistency bug, not a hypothetical one.
**Decision.** `department` (already required at signup since the first slice) is joined by
`facility` — optional, since not every member's practice location is settled or worth requiring
at signup. `grade`, `subspecialty`, `town`, `phone`, `whatsapp` stay in `/portal/profile`; the
card's title line ("Consultant Paediatrician") degrades gracefully to specialty alone until grade
is set. Directory projection moves off `decideVerification` entirely and onto a new Firestore
`onUpdate` trigger, `onMemberWrite` (`functions/src/directory-projection.ts`), which fires on
every `members/{uid}` write — the approval write `decideVerification` makes, and every later
profile edit — and upserts or deletes `directoryEntries`/`publicDirectory` based on the
document's current `status`/`publicListingConsent`, not the state at approval time.
**Consequence.** `decideVerification` now does one job — claim, status, audit trail — and the
trigger is the single source of truth for keeping both directory collections in sync, including
consent revocation (which deletes the `publicDirectory` doc, not just stops updating it) and
suspension (which removes a member from `directoryEntries` too, not only the public one). Cost:
one more Function, and directory updates are now eventually-consistent with a profile edit rather
than synchronous with it — acceptable, since nothing currently depends on that being instant.

---
## ADR-015 — `middleware.ts` → `proxy.ts`; kept as a fast, non-authoritative first pass
**Context.** Next.js 16 deprecated the `middleware.ts` file convention and renamed it to
`proxy.ts` — same capability, and as of v16.0.0 Proxy defaults to the **Node.js runtime**, not
Edge (confirmed against `node_modules/next/dist/docs/.../file-conventions/proxy.md`, not assumed
from memory). That's a material change from when this project's gate was first built: Edge
middleware could only check a cookie's *presence*, because `firebase-admin` cannot run there.
Node-runtime Proxy can call the Admin SDK directly, which raised the question of whether the real,
`checkRevoked: true` session check should just move into `src/proxy.ts` and drop the second check
in the `/portal`/`/admin` layouts entirely.
**Decision.** Rename the file (`src/proxy.ts`, export renamed to `proxy`) but keep the two-layer
shape. `src/proxy.ts` now calls the real `verifySession()` (Admin SDK) instead of a bare
presence check — genuine improvement, not just a rename — but still with `checkRevoked: false`,
and the authoritative `checkRevoked: true` re-check stays server-side in the `/portal` and
`/admin` layouts. Reasons this isn't collapsed to one layer: (1) Next's own docs warn that a
matcher change, or a Server Function moved to a different route, can silently lose Proxy coverage
— a bug there fails open, not closed; (2) revocation lookups are the more expensive check and
don't belong on every request Proxy sees, including static assets before matcher exclusion; (3)
this mirrors the same defence-in-depth reasoning `.claude/rules/security-rules.md` already asks
for in Cloud Functions — never let one layer's pass stand in for authorisation everywhere it
matters.
**Consequence.** `src/lib/auth/session.ts`'s `verifySession()` is now genuinely shared, exercised
identically by both layers, not two similar-looking checks that drift apart — `tests/auth/`
covers each caller. `.claude/rules/nextjs-boundaries.md` item 8 (previously "Middleware runs on
the Edge runtime, no Node APIs") is corrected to describe the Node-runtime reality; the migration
codemod (`npx @next/codemod@canary middleware-to-proxy .`) is the documented path if this ever
needs re-running on a future rename.
