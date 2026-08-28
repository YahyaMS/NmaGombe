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

---
## ADR-016 — Three-tier JS budget, not one; admin routes accept weight, member routes fight for it
**Context.** Building `/portal/cpd` (the first Phase 2 slice) surfaced that its route was
~375.7KB gzipped first-load JS — measured by gzipping the exact chunks Next's own
`route-bundle-stats.json` lists as that route's first load, not estimated. Every other
authenticated portal route measured the same, ~370–376KB. ADR-011 already flagged that Firebase
Auth+Firestore alone is ~211KB gzipped and exceeds the single 200KB budget in `CLAUDE.md`; this
is the "dedicated bundle pass" ADR-011 said would be needed before launch.

**What was actually measured, in order** (each step re-verified against the shipped bytes, not
assumed from the previous step):
1. **The interactive `next experimental-analyze` UI over-counts.** It showed `re2js` (83.97KB) on
   every route including public ones. Grepping the actual shipped chunk files directly found zero
   occurrences anywhere — `re2js` is a real transitive dependency of `@firebase/firestore`
   (confirmed in that package's `package.json`) but isn't part of the browser bundle, likely a
   Node-only code path. The analyzer's per-route view is not reliable for "what does this route's
   first load actually ship" — `route-bundle-stats.json` + direct gzip of the listed files is.
2. **`firebase/storage` was imported eagerly** in the old single-file `lib/firebase/client.ts`,
   so every portal route paid for it whether or not it ever uploaded anything. Deferred to a
   `getStorageClient()` function, loaded only at the point `/portal/cpd`'s certificate attach
   calls it. Saved only ~5.4KB gzip — Storage's own code was never the big line item (~7KB raw);
   removing it didn't let anything else drop out too, since Firestore/Auth pull in their own
   transport (`webchannel`, gRPC-web) independently.
3. **`db` (Firestore) was *also* eagerly bundled**, for the same reason: `client.ts` was one file
   initializing `app`/`auth`/`db`/`functions` unconditionally at module top level, so a route
   needing only `auth` (e.g. `/admin/verification` after its list moved to the Admin SDK) still
   paid Firestore's ~161KB-gzip chunk for nothing — confirmed by grepping that chunk for
   `initializeFirestore`/`persistentLocalCache` and finding them present despite the route never
   calling a Firestore client function.
4. **Split `lib/firebase/client.ts` into `app.ts` (init + a shared, verified emulator-connect
   guard) + `auth.ts` + `functions.ts` + `db.ts`**, each independently importable, so a route only
   bundles the service it actually calls. `client.ts` is now a thin re-export of `app`/`auth`/`db`
   (what the offline tier needs) plus `getStorageClient()` — it deliberately does **not**
   re-export `functions`, so importing it can never silently pull Firestore back in for a route
   that only needs Auth.
5. **The existing emulator-connect guard was checking a property, `_isEmulator`, that does not
   exist anywhere in the installed Firebase SDK** — confirmed by grepping every `@firebase/*`
   package. It was a silent no-op, not a working guard. Replaced with `markEmulatorConnected()`
   in `app.ts`, which attaches a real flag to the `app` singleton (survives Fast Refresh via
   `firebase/app`'s own `getApps()` registry, unlike a plain module-level variable).
6. **`establishServerSession()`** (called by both client-side guard hooks on every authenticated
   page load, including the offline tier) **lived in `auth-email-link.ts`**, which also imports
   `db` for email-link rate-limiting — importing one function from that file bundled the whole
   module. It has zero Firebase dependencies of its own (just `fetch`), so it moved to its own
   `lib/firebase/session-bridge.ts`.

**Decision — three tiers, not one, and an explicit asymmetry between them:**
- **Public / SSR-authenticated: ≤ 200KB, strict.** Measured floor ~144.1KB (identical to
  `/news`'s pre-existing number — the framework baseline every route pays) up to ~160.8KB for an
  SSR page with a small interactive form (the `zod`-validated `/admin/news/new`,
  `/admin/events/new`). This tier is now `/admin`, `/admin/news(/new)`, `/admin/events(/new)` —
  converted from client Firestore reads/writes to Server Components reading via the Admin SDK,
  with Route Handlers (`/api/admin/news`, `/api/admin/events`) doing the writes. These two had no
  Cloud Function to begin with, so moving the write off the client doesn't create a second
  privileged write path — there was only ever one.
- **Admin, still `httpsCallable`: ≤ 250KB.** Measured ~195–210KB (`/admin/verification` 194.9KB,
  `/admin/members` 195.2KB, `/admin/broadcast` 210.3KB — Auth + Functions, no Firestore, after the
  module split above). These three mutate trust fields or write an audit log
  (`decideVerification`, `setMemberStatus`, `setMemberRole`, `logBroadcast`) through an existing
  Cloud Function. **Deliberately not converted to a Route Handler**, even though that would reach
  the ~144KB tier too: two live paths to the same trust-field write is a wider security surface
  than one (`CLAUDE.md` rule 1's whole reason for existing), and the byte saving on a route three
  people open is not worth doubling the write surface on the most privileged actions in the
  system. The list *read* on all three did move to the Admin SDK (Server Component), since a read
  carries none of that risk.
- **Offline-capable member routes: ≤ 400KB**, accepted cost of real offline capability
  (ADR-002's whole reason Firestore was chosen over Supabase). Measured ~365.5–366.8KB:
  `/portal`, `/portal/card`, `/portal/directory`, `/portal/directory/[uid]`, `/portal/cpd`,
  `/portal/jobs`, `/portal/jobs/new`, `/portal/profile`. `/pending` (364.0KB) is the same tier
  for the same reason ADR-011 already gave — it's mid-signup, not yet verified, but still needs
  the client Auth SDK.
  `/portal/jobs`/`/portal/jobs/new` (366.0/365.9KB) join by measurement, not assumption — both
  write directly to Firestore under `firestore.rules` (member-posted content, not privileged),
  the same shape as `/portal/cpd`'s own create path, so the client Firestore SDK was never
  avoidable here regardless of whether the board itself needs to work offline.

**The asymmetry, stated plainly:** the offline tier's weight is paid by hundreds of members on
paid mobile data in Gombe. The admin tier's weight is paid by the Secretary and a couple of exec
members. Optimise where the users are. Admin routes are where weight is accepted for a single
privileged write path; member routes are where every KB is fought for. Do not "optimise" the
`httpsCallable` admin routes later by moving their mutation to a Route Handler without
re-deriving this trade-off first — the saving is real (~50KB) but was judged not worth a second
write path to `members.status`/`role` or the verification/broadcast audit trail.

**Two routes stay in the offline tier by deliberate exception, not oversight:**
- **`/portal` (the dashboard).** It renders the folio card inline via a live `onSnapshot` on
  `members/{uid}`, not just a link to `/portal/card` — the roadmap's launch plan is a WhatsApp
  screenshot of exactly this screen. Splitting it to an SSR shell that links out to the card
  instead would save ~226KB, but the dashboard is the first thing a member sees after signing in,
  and `CLAUDE.md`'s offline list names the membership card — the dashboard renders the card, so
  it inherits the requirement. Making a member tap through to see their own card to save bytes on
  the one screen that proves the portal is worth opening was judged the wrong trade.
- **`/portal/profile`.** The write (`updateOwnProfile`) stays on client Firestore under
  `firestore.rules`, not a Route Handler, even though the read could be (and is) server-rendered.
  Same reasoning as the admin fork: `firestore.rules` already denies trust-field changes and
  freezes `folioNumber` after verification, backed by the 58 tests in `tests/rules`. Replacing
  that with a Route Handler means re-implementing those constraints in TypeScript, enforced by
  code instead of rules with an audited test suite behind them — not worth it for one route. The
  cost accepted: `/portal/profile` stays near the offline tier's weight even though nothing on
  the page needs to work offline.

**Consequence.** `npm run analyze`'s interactive UI should not be trusted for per-route totals
without cross-checking against `route-bundle-stats.json` and a direct gzip of the listed files —
document this the next time bundle work happens here, don't re-discover it. The CI budget check
(`.github/workflows/ci.yml`) enforces these three thresholds per route, so a regression fails the
build instead of waiting for someone to remember to run `analyze`. Lighthouse mobile scores for
any of this are still unverified — these are transferred-byte measurements, not a real-device
performance run; that's a separate, still-open verification (register item 03).

---
## ADR-017 — Event date/time forms assume the exec is in Nigeria; accepted, not fixed
**Context.** `EventForm`'s `startAt` field is a `datetime-local` input. The create path does
`new Date(startAtString)` to turn it into a stored UTC `Timestamp` — and per the JS spec, a
date-time string with no explicit offset is parsed as **the browser's local time zone**, not
Africa/Lagos. Building the edit path (`/admin/events/[slug]/edit`) required prefilling that same
input from the stored UTC value, which meant inverting whatever assumption create had made —
and surfaced that create was never pinned to Africa/Lagos at all, just to wherever the exec's
device happened to think it was.
**Decision.** Keep the assumption, on both sides, rather than fix one and leave the other
disagreeing. The edit form's `toDatetimeLocalValue()` (`src/components/admin/EventForm.tsx`)
inverts create's exact browser-local-time behaviour — subtracting the same timezone offset
`new Date(datetimeLocalString)` would have applied — so a value round-trips correctly for an
exec sitting in the same time zone they (or a colleague) created it in. This is accepted with a
known limitation, not treated as fixed: **every exec is assumed to be physically in Nigeria
(Africa/Lagos, UTC+1, no DST) when they publish or edit an event.** An exec travelling abroad and
scheduling an event from their laptop would have it silently stored and later re-displayed at
the wrong local hour — wrong by their departure/return offset, not caught by any validation,
because both the write and the read make the identical wrong assumption and therefore agree
with each other.
**Why not fix it properly now.** The correct fix — an explicit `Africa/Lagos` conversion at the
form boundary, the same pattern `.claude/rules/nextjs-boundaries.md` item 2 already prescribes
for *rendering* a stored date, applied here to *parsing* an entered one — is straightforward, not
hard. It wasn't done in this slice because scoping it into the same PR as the
edit-path build would have meant re-deriving and re-testing create's date handling too, for a
failure mode (an exec travelling with a laptop) that hasn't happened yet and that the "small
slice, not scope-creep" instruction for this work was explicit about avoiding. Recorded here so
the next person who hits this finds the reasoning, not just the symptom — the fix, when it
happens, touches both `EventForm.tsx`'s submit and its `toDatetimeLocalValue()` prefill together,
not just one.
**Consequence.** No code change from this ADR alone. `docs/03-DATA-MODEL.md`'s `events/{slug}`
section points here. If a chapter event is ever scheduled by someone outside Nigeria, expect the
displayed time to be wrong by their local offset from Lagos — that's this limitation, not a new
bug.

---
## ADR-018 — Service worker caching strategy: network-first for HTML, cache-first for immutable assets only
**Context.** A production bug report (member-reported, several days into the site being live)
turned out to be `public/sw.js` caching page HTML **cache-first**, under a cache name
(`nma-shell-v1`) that never changed between deployments. The `activate` handler's own cleanup
logic — delete any cache whose name doesn't match the current constants — was correct in
principle but a no-op in practice, because the constants it compared against never changed. Once
a visitor's browser cached the shell (which happens on the very first visit, by design — the
whole point of a PWA shell), every subsequent visit served that same cached HTML forever,
regardless of how many times the site was redeployed. Because a soft (client-side) navigation
from a stale cached page runs on the JS bundle that page's stale HTML references, the damage
wasn't limited to that one page: navigating from a stale `/` into `/portal` rendered `/portal`
using old, frozen client code, even though the server had current code the whole time. Multiple
days of routine visual review were effectively performed against stale builds without anyone
knowing, because nothing about a "successful Vercel deploy" or a passing smoke suite (a fresh
browser context per test — see below) would have surfaced it.
**Decision.**
- **Navigation requests (HTML documents): network-first**, cache only as a fallback for being
  offline. An HTML document is not immutable content — caching it cache-first means serving
  stale pages *by design*, not by bug. This is the actual fix; the version bump below is
  secondary.
- **Static assets (JS/CSS/fonts/images): unchanged, cache-first.** Next.js content-hashes these
  filenames, so a changed file is a new URL the cache has never seen — cache-first here was
  already correct and needed no version scheme at all.
- **Cache name for HTML only** (`nma-html-${CACHE_VERSION}`) is versioned per deploy —
  `scripts/inject-sw-version.mjs`, run as npm's `prebuild` hook, substitutes the deploying
  commit's SHA (`VERCEL_GIT_COMMIT_SHA` on Vercel, `git rev-parse` locally) into `public/sw.js`
  before `next build` runs. This makes the `activate` handler's existing cleanup logic
  meaningful for the first time. The asset cache (`nma-assets`) is deliberately **not**
  versioned and never purged on `activate` — content-hashing already guarantees correctness, and
  purging it on every deploy risks a tab still running the previous version requesting a chunk
  whose cache entry was just deleted out from under it.
- **`sw.js` itself is served with `Cache-Control: no-cache`** (`next.config.ts`). If the worker
  script's own bytes were cacheable by the browser's HTTP cache, this fix — or any future one —
  might never actually reach a returning visitor's browser at all.
- **`skipWaiting()`/`clients.claim()` kept** (already present) so a new worker takes over
  immediately rather than waiting for every open tab to close, which on a phone can be days. Safe
  under the new strategy specifically because the asset cache is never purged: a tab still
  running old JS can still resolve any chunk URL that JS asks for, even after a new worker has
  taken over.
- **`/portal`, `/admin`, `/api/` remain untouched by the worker entirely** (`NEVER_CACHE`) — the
  one thing the original version already had right, and why admin-approval state was reported as
  correctly reflecting even while everything else looked frozen.
**Consequence — this is the important part, so it's stated plainly.** Every visual review of this
site performed by anyone before this fix landed was potentially performed against a stale build,
not the one actually deployed. That includes any executive demo given on a phone that had
previously loaded the site — see `docs/07-CONTENT-OPS.md` for the recovery-path note added for
exactly that audience. Going forward: **the smoke suite cannot catch this class of regression**
(`tests/smoke/pages.spec.ts` — Playwright gives every test a fresh browser context, so no service
worker ever persists between tests; every smoke test is architecturally a first visit).
`tests/smoke/service-worker.spec.ts`'s `service worker serves fresh content on a second visit` test closes
that gap: it loads a page in a **persistent** context, waits for the worker to activate, reloads,
and asserts the reload's content still matches the live server response rather than a cache hit
— the second-visit case, which is what every real returning visitor after day one actually is.
Any future change to `public/sw.js` must keep HTML navigation network-first; a future engineer
tempted to "optimise" it back to cache-first for perceived speed would silently reintroduce this
exact bug.

---
## ADR-019 — Real QR wired to NEXT_PUBLIC_SITE_URL, not a hardcoded (and non-resolving) domain
**Context.** `components/ui/FolioCard.tsx`'s on-screen QR was `QrPlaceholder()` — a hand-drawn SVG
encoding nothing — while `lib/render/qr.ts` already generated a genuinely scannable QR for the
downloadable PNG and verify OG image, hardcoded to `nmagombe.org.ng`. Checked before wiring
anything: that domain does not resolve at all (`getaddrinfo ENOTFOUND`), `docs/00-INTAKE.md` item
19 (domain registration) is still open and unstruck, Vercel's project has zero domains attached,
and `firebase.json` has no `hosting` config either. So the *existing*, already-shipped
downloadable-card and OG-image QR codes were encoding a dead domain the whole time — real QR
mechanics, pointed at nothing. This wasn't caught by the codebase audit that found the on-screen
placeholder, because that audit checked whether comments/docs matched code, not whether a
hardcoded runtime value actually resolves.
**Decision.** `lib/render/qr.ts`'s `verifyUrlFor()` now builds an absolute `/verify/[folio]` URL
from `NEXT_PUBLIC_SITE_URL` (validated, `lib/firebase/env.ts`) instead of a hardcoded host. Wired
into `FolioCard.tsx` directly — the same generator the PNG/OG-image path already used, one
implementation for all three surfaces. `NEXT_PUBLIC_SITE_URL` in Production currently resolves to
`https://nma-gombe-tau.vercel.app` (confirmed by reading the live homepage's `metadataBase`-derived
`og:image` URL, not by trusting Vercel's masked env-var listing) — Vercel's own stable alias, not
the chapter's eventual real domain. Shipped anyway, deliberately, for the **on-screen and
downloadable** card only: both regenerate fresh from the current env var on every render/download,
so there is no permanence problem — the QR simply encodes whatever's currently true. A **printed**
physical card is a different artefact entirely: once printed, its QR is permanent in a way a
webpage isn't, and a card issued today would carry a QR pointing at a Vercel preview alias forever.
Printing was explicitly out of scope for this decision and must not be treated as silently covered
by it.
**Consequence.** Every card view/download from now on is genuinely scannable and resolves
correctly, using whatever domain is currently configured. When the real `.org.ng` domain is
registered and `NEXT_PUBLIC_SITE_URL` is updated to it, every on-screen/downloaded card
automatically starts encoding the new domain with no code change — but anyone who **printed** a
card before that point holds a QR pointing at the old Vercel alias, which will likely still resolve
(Vercel doesn't reuse stable aliases across unrelated projects) but is not the chapter's real
address. If and when physical printing becomes a real plan, revisit this ADR before shipping it —
the honest fix then is holding printing until the domain lands, not assuming this decision already
covers it.

**Update, 2026-08-27 — real domain live.** `nmagombe.org` (not `.org.ng` — see
`docs/00-INTAKE.md` item 19) purchased and connected via Vercel. `NEXT_PUBLIC_SITE_URL` set to
`https://nmagombe.org` in Production and a redeploy triggered
(`npx vercel redeploy <deployment-url>`, not `vercel deploy`, which failed locally on a stray
`firebase-debug.log` — a Windows file-lock issue unrelated to the domain itself). Confirmed via
the live `og:image` URL, the same method used to confirm the Vercel-alias value originally — every
folio card QR now encodes the real domain, no code change required, exactly as this ADR predicted.
The Vercel-alias-era caveat above still applies to anything printed before this date.

---
## ADR-020 — App Check: client wired, enforcement deliberately deferred to a second, later step
**Context.** A codebase-honesty audit found `lib/firebase/client.ts` asserting "Access control
lives in firestore.rules + App Check" as a present-tense fact, and `docs/02-ARCHITECTURE.md`,
`docs/03-DATA-MODEL.md`, `docs/06-ROADMAP.md`, and `docs/08-NDPA-COMPLIANCE.md` each citing App
Check as an active mitigation against directory scraping — while `lib/firebase/app.ts`'s own
comment said, correctly, "Not built yet." No App Check code existed anywhere. `NEXT_PUBLIC_APPCHECK_SITE_KEY`
was reserved in `.env.example` and validated (optional) in `lib/firebase/env.ts`, but nothing read
it. Real activation needs a reCAPTCHA v3 site key registered in Firebase Console under App Check —
a console action outside this codebase, not something that can be produced from here.
**Decision.** Two steps, deliberately not taken together:
1. **Client-side init, shipped now** (`lib/firebase/app.ts`). Dynamically imports
   `firebase/app-check` and calls `initializeAppCheck()` with `ReCaptchaV3Provider`, but only when
   `env.NEXT_PUBLIC_APPCHECK_SITE_KEY` is actually set and emulators are off. Today that variable
   is unset in every environment, so this is a genuine no-op — not just functionally inert but
   zero bundle cost too, since the dynamic import never fires. Once a real site key is registered
   and set in Vercel, this starts attaching a token to every Firestore/Auth/Functions/Storage call
   on the next deploy, with no further code change.
2. **Enforcement — NOT shipped, and must not be shipped until step 1 is confirmed live in
   production.** Enforcement means two separate things, both still undone on purpose: turning on
   "Enforce" per-service (Firestore, Storage) in Firebase Console, and adding
   `enforceAppCheck: true` to each `onCall` in `functions/src/` (`decideVerification`,
   `markAttendance`, `unmarkAttendance`, `setMemberStatus`, `setMemberRole`, `logBroadcast`).
   **Deliberately not added to the Functions source in this pass**, specifically because this
   project's standing instruction is to deploy Cloud Functions automatically once a slice is
   tested — if `enforceAppCheck: true` had been written into the Functions now, an ordinary
   "tested, so deploy it" pass could ship it to production before any client is actually sending
   App Check tokens, which would reject every real exec/admin action (verification decisions,
   attendance marking, member status/role changes, broadcast logging) alongside the scripted
   traffic it's meant to stop. That is a self-inflicted outage of every admin workflow in the app,
   not a security improvement.
**Consequence.** Every doc claim above has been corrected to state the true current split: client
wiring exists, enforcement does not, and citing "App Check" as an active control anywhere is wrong
until this ADR's step 2 is deliberately, separately done. The activation sequence when the chapter
is ready: (a) register the reCAPTCHA v3 site key in Firebase Console, (b) set
`NEXT_PUBLIC_APPCHECK_SITE_KEY` in Vercel and redeploy, (c) confirm via Firebase Console's App
Check metrics that real production traffic is showing verified tokens, (d) only then add
`enforceAppCheck: true` to the six `onCall` functions above and turn on "Enforce" for Firestore
and Storage. Skipping straight to (d) is the failure mode this ADR exists to name.

**Open flag, 2026-08-27 — not yet investigated.** `NEXT_PUBLIC_APPCHECK_SITE_KEY` is now set in
Vercel Production and Preview. Unconfirmed whether it predates this ADR (meaning "unset in every
environment," above, was already wrong when written) or was added after. If it's a real key,
`lib/firebase/app.ts`'s dynamic import is no longer a no-op — App Check may already be
client-initializing in production right now. Deliberately not investigated further yet; do not
assume either the "still a no-op" framing above or full activation until someone checks.

---
## ADR-021 — Dues payment deferred to Version 3: no CAC registration, not a near-term blocker
**Context.** Every prior doc in this project treats dues payment as "blocked on the Paystack
merchant account" — phrased as a resolvable, near-term intake gap (`docs/00-INTAKE.md` item 5
originally: "Confirm what the chapter can produce *before* promising online dues"). Confirmed,
2026-08-27: the Gombe chapter has no CAC (Corporate Affairs Commission) registration, a legal
prerequisite Nigerian payment gateways require of the registered entity behind a merchant
account. Only the *parent national* association is CAC-registered, and it already collects
national dues under that registration, separately from this chapter. This is not a "the chapter
needs to go get a document" gap with a visible timeline — it's a structural fact about the
chapter's legal status that this project has no ability to change and no visibility into if or
when it might change. A codebase audit found no functional dependency on dues existing: every
active surface (`FolioCard`, `PortalDashboard`, `CardView`, the homepage's real-card section)
already renders `status: 'dues-not-recorded'` and simply omits the dues line — the graceful-
degradation design was already correct going in. The only real gap was documentation and
copy treating "coming soon" as true when it no longer reads as honest at this distance.
**Decision.** Dues payment (rates, Paystack init, webhook, receipts, ledger export, and every
route that depends on it — `/portal/dues`, `/portal/dues/receipt/[ref]`, `/admin/payments`,
`/admin/duesRates`, the dues-cycle reminder) moves out of Phase 1/MVP entirely and into
**Version 3** — unscheduled, revisited only if the chapter's registration status changes.
`docs/01-PRD.md`'s "MVP = 1 + 2" (directory + dues) becomes **MVP = 1** (directory alone is the
anchor); the folio card remains the artefact of verification, just no longer paired with a
payment step. Every "blocked on the Paystack merchant account" phrasing across the docs — worded
as if resolving intake item 5 were still plausible on this project's timeline — is corrected to
name the real, structural reason. User-facing copy that implied dues payment is an active or
imminent feature ("pay dues online," "on their way," "administer dues") is corrected or removed;
`docs/01-PRD.md:55` already said "Use WhatsApp broadcast; email is receipts only" for the
newsletter decision — the same "don't promise a channel you don't have" discipline now applies
to dues copy too.
**Consequence.** The already-tested `payments/{ref}` and `duesRates/{year}` Firestore rules,
`duesPaidThrough`'s trust-field protection, and the `FolioCard`'s `dues-not-recorded` status stay
exactly as built — inert groundwork that costs nothing to leave in place and will still be
correct if this is ever revisited. Nothing in the shipped app changes behaviour; this ADR is a
documentation and copy correction, not a code change, which is itself the finding worth recording:
the graceful-degradation discipline this project held from the start meant deferring a "Phase 1
anchor" feature indefinitely broke nothing.

---
## ADR-022 — Clinical guideline files never served via Storage getDownloadURL()
**Context.** `/portal/documents` (`docs/06-ROADMAP.md`'s "clinical guideline repository") needed
a way for a verified member to fetch a PDF the chapter has published — guidelines, forms,
circulars. The obvious Firebase-native approach, already used elsewhere in this codebase for CPD
certificates (`lib/data/cpd.ts`), is `getDownloadURL()`: call it once under a rules-gated read,
get back a stable HTTPS URL, fetch it directly. That pattern is correct for `cpd/{uid}/{file}`,
which is genuinely uid-scoped — only the owner or an exec can even generate the URL in the first
place, and leaking one exposes at most that one member's own certificate to themselves. It is
**not** correct here: `documents/{id}` is a shared, member-only library, not uid-scoped, and a
`getDownloadURL()` token — once issued — is not re-checked against `storage.rules` on later
requests. The token in the URL is the only thing the public HTTP download endpoint checks; the
`allow read` rule that gated the *first* fetch plays no further part. `storage.rules`' own
opening line already states the relevant principle: "Unguessable URLs are not security."
Applying `getDownloadURL()` to a "member-only" resource would violate that principle the file
already commits to — a copied or logged link would keep working for anyone, forever, regardless
of whether the holder is still a verified member, or a member at all.
**Decision.** `storage.rules`' `guidelines/{id}/{file}` path is `allow read, write: if false`
unconditionally — no client, member or exec, can reach it directly, rules or no rules. Both
directions go through the Admin SDK instead, which bypasses `storage.rules` entirely but
re-checks authorisation itself in code (CLAUDE.md rule 2): exec upload via
`POST /api/admin/documents` (session-cookie, `isExec`), member download via
`GET /portal/documents/[id]/download` (Bearer `<ID token>`, `verified === true`), the exact same
authorisation shape `/portal/card/download` already established for a different reason (serving
computed, not-yet-existing content). Every single download request re-verifies `verified` —
there is no standing link that keeps working after a member is unverified or removed, which a
`getDownloadURL()` token would.
**Consequence.** A member can never share a guideline's raw link — every "open" or "save for
offline" action re-authenticates. The cost is real: no CDN caching of the file bytes at Firebase's
edge, and every fetch is a Cloud Function-adjacent Route Handler round trip rather than a direct
Storage hit. Acceptable here — a member-only clinical-document library is exactly the kind of
content this project's own stated threat model (`docs/03-DATA-MODEL.md`: "assume someone will try
to scrape it") should treat as sensitive by default, not the kind of content worth optimising a
CDN path for. If this collection ever becomes genuinely public (no reason to today), revisit this
ADR before switching back to `getDownloadURL()` — don't let the convenience quietly re-open the
gap this ADR closed.

---
## ADR-023 — Firestore subscription errors were misreported as "offline"; jobs' index was also stale
**Context.** A member reported `/portal/jobs` showing "You're offline... connect once and it'll
be available offline after that" while actively using the site — not actually offline. Two
separate bugs, found together. First: `firestore.indexes.json` correctly defines a
`status + createdAt` composite index for `jobs` (matching `lib/data/jobs.ts`'s real query and
`docs/03-DATA-MODEL.md`'s "newest-first, not soonest-expiring" decision), but production had
never had that index deployed — it still only had a stale `status + expiresAt` index from an
earlier design, left over and unused. `subscribeToActiveJobs`'s query failed with
`failed-precondition` on every load. Second, and the more durable problem: `JobsBoard.tsx`'s
`onSnapshot` error callback — like five other `/portal` components' — routed *every* subscription
error, regardless of cause, to the same "you're offline" UI. A missing index, a permissions gap,
any real backend problem: all rendered identically to a dead connection, telling the member to do
the one thing (reconnect) that could never fix it, and hiding the real error from whoever tried to
debug the report next. `DirectoryView.tsx` already had this right — its `onError` goes straight to
a genuine `'error'` stage, with `navigator.onLine` used only for a separate, narrower
"never-synced-and-currently-offline" timeout case — but that pattern was never carried to the
other five components built after it.
**Decision.** Deployed the missing `jobs` index (`firebase deploy --only firestore:indexes`);
the stale `status + expiresAt` one was left in place rather than force-deleted, since an unused
index is harmless and deleting requires `--force` (a destructive flag not worth reaching for
here). Extracted `lib/data/classifyDisconnection()` — `navigator.onLine ? 'error' : 'offline'` —
and wired it into every `/portal` component's subscription `onError` that was previously
collapsing both cases together: `PortalDashboard`, `CardView`, `CpdLog`, `JobsBoard`,
`DocumentsPage`. Each gained a genuine `'error'` stage and an honest "Something went wrong.
Reload to try again" message, distinct from the offline one.
**Consequence.** A future missing index, permissions gap, or any other real backend failure on
one of these five pages now says so, rather than blaming the member's connection — and is
therefore debuggable from the report itself, the way this incident should have been the first
time. `firestore.indexes.json` matching the code is necessary but not sufficient — it has to
actually be deployed; a stale-index audit (`npx firebase-tools firestore:indexes --project
nma-gombe-c5a9d`, diffed against the file) is worth running after any query shape change, not
assumed from the file alone.

---
## ADR-024 — A ~300-name doctor list was not published; no consent basis to
**Context.** Supplied 2026-08-28: a plain list of roughly 300 names, described as "the list of
all the members currently practicing under the association," with a request to show "a register
of all the numbers at a glance" because "some members will never register on the site so waiting
for them to do that will not be reliable." The list has no folio numbers, specialties, facilities
or contact details — names only — and is visibly unstructured: inconsistent name-order formatting
across entries, at least one exact duplicate, a stray "NAME" header mid-list, and several entries
carrying unexplained numeric suffixes that look like they belong to some other export's ID or
dues-status column, not reproduced here. There is no way to confirm these are current, licensed,
practising members versus a legacy contact list, and — the deciding fact — none of them have gone
through this project's own consent flow.
**Decision.** Not published anywhere on the site, public or member-only. This project already
built the correct mechanism for "who's a real, current member": `/signup` → `/admin/verification`
→ `directoryEntries`, populated only once a real person has submitted their own folio number, an
admin has matched it against a roster, and the member has separately opted in per field to
directory listing (`consentRecordSchema`, `docs/08-NDPA-COMPLIANCE.md`: "a pre-checked box is not
consent"). Publishing this list would bypass every part of that — no signup, no verification, no
consent — for real people who may not even know they're listed. It would also directly contradict
ADR-012's existing reasoning for *why* the directory is never pre-seeded with placeholder entries:
no specialty/facility/folio to seed usefully, and no claim step for someone to correct a wrong or
unwanted entry. Saved instead to `data/roster-doctors-list-2026.csv`, gitignored, the same
treatment as `data/roster-2025-2026.xlsx` (item 9) — usable only as an admin's name-matching aid
during `/admin/verification`, never surfaced to members or the public.
**Consequence.** The chapter's actual problem — members who will plausibly never self-register —
is real and not solved by this ADR; it's deliberately left unsolved rather than solved wrongly.
If a "register at a glance" is still wanted, the legitimate path is bulk-inviting or bulk-
verifying these specific people through the real flow (e.g. an admin-initiated pre-verification
for named individuals, with each one still getting the chance to set their own directory
visibility once they sign in) — a real feature, not a data dump, and one that needs its own
plan and consent design before any code gets written. Revisit with the chapter, not by quietly
widening this ADR later.
