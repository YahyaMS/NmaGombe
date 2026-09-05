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

**Update, 2026-08-29 — investigated properly; still a genuine no-op, and the provider changed.**
Vercel's env var predates this ADR (created 8 days before this update, versus the ADR's own
2026-08-25 client-wiring commit) — the "unset in every environment" claim above was already wrong
the day it was written. But it does **not** mean App Check has been silently active: verified
directly, not assumed. Submitted a real sign-in on the live production site and inspected the
actual outgoing network request — no `X-Firebase-AppCheck` header, zero reCAPTCHA or App Check
exchange requests. Then found `lib/firebase/app.ts`'s exact compiled code in the live bundle: the
entire App Check `if` block is absent, meaning the bundler proved it dead code at build time,
which only happens when the env var evaluates empty/falsy *during the Vercel build*. The Vercel
dashboard shows a value exists but marks it "Sensitive," which blocks viewing or copying it back —
so neither the user nor this session could confirm what's actually stored. Root cause not pinned
down (attempting `vercel env pull` to inspect it was blocked by this session's own permission
settings) and not worth chasing further, since it's being replaced anyway: **Google has deprecated
classic reCAPTCHA v3 in favour of reCAPTCHA Enterprise** (confirmed directly from Firebase
Console's own deprecation notice while the user was there registering it — not assumed from
training data, which could easily be stale on exactly this kind of platform change). Code updated
accordingly: `lib/firebase/app.ts` now imports `ReCaptchaEnterpriseProvider`, not
`ReCaptchaV3Provider` — confirmed a real export in the installed `@firebase/app-check` SDK's
`.d.ts` (the `firebase` package pins `12.17.1`) before shipping, not assumed. The
activation sequence in this ADR's Consequence section is otherwise unchanged, except step (a) now
reads "register a reCAPTCHA **Enterprise** key" — still gated on the same confirmation step (c)
before enforcement, still nothing rejected by any of this until that's deliberately, separately
done.

**Update, 2026-08-29 — step (c) confirmed, directly, not from Console metrics.** Real reCAPTCHA
Enterprise site key registered and set as `NEXT_PUBLIC_APPCHECK_SITE_KEY` in Vercel Production
(`vercel env rm` + `vercel env add`, same working pattern as `NEXT_PUBLIC_SITE_URL`), redeployed.
Verified end-to-end on the live site the same way the earlier "is this actually working" question
was answered — not by reading Firebase Console's App Check metrics (the original plan, abandoned
after the user couldn't confidently interpret what that page was showing), but by submitting a
real sign-in on `https://nmagombe.org/signin` and inspecting the actual network traffic directly:
`enterprise.js` loads and executes against the real site key, scoped correctly to the `nmagombe.org`
origin; `exchangeRecaptchaEnterpriseToken` returns **HTTP 200** with a real signed App Check JWT
(1-hour TTL); the subsequent Identity Toolkit `sendOobCode` call carries a genuine
`X-Firebase-AppCheck` header. Step (c) is done. Step (d) — `enforceAppCheck: true` on the six
`onCall` Functions, and turning on "Enforce" for Firestore/Storage in Console — is still not
done, and still requires a separate, explicit decision; this update closes the verification gap,
it does not itself authorise enforcement.

**Update, 2026-08-29 — user explicitly authorised enforcement; Functions half done and deployed.**
`enforceAppCheck: true` added to all six `onCall` functions (`decideVerification`,
`markAttendance`, `unmarkAttendance`, `setMemberStatus`, `setMemberRole`, `logBroadcast`) and
deployed via `firebase deploy --only functions`. Local smoke suite (21/21) still passes against
the emulator with this change — a weaker signal than it looks: `lib/firebase/app.ts` skips App
Check entirely under `usingEmulators`, so the emulator-based test client never sent a token
either before or after this change, and Firebase's Functions emulator does not appear to enforce
App Check as strictly as production regardless. This confirms the code change didn't break
anything structurally; it does **not** confirm a real exec session against production still
works with a valid token attached to an actual callable-Function invocation — only Auth REST
calls (`sendOobCode`) were directly verified in the update above, not `httpsCallable`. Firestore
and Storage "Enforce" in Console remain deliberately untouched — the highest-blast-radius half of
step (d), since it would affect every verified member's `/portal` reads, not just six admin
actions — and require a Console click only the user can make; see `docs/00-INTAKE.md`-style
follow-up needed: confirm a real admin action (e.g. `/admin/broadcast`, lowest-stakes of the six)
still works in production before treating the Functions half as fully validated, not just deployed.

**Update, 2026-08-29 (same day) — confirmed broken, rolled back immediately.** The requested
verification found exactly the failure this ADR's whole caution was about: `/admin/broadcast`
failed with "Couldn't log this broadcast — try again" on one device, then succeeded moments later
on the user's PC. Same account, same action, inconsistent outcome — consistent with reCAPTCHA
Enterprise's client-side attestation not reliably completing before the token was needed on every
device/browser (slower devices, stricter privacy settings, or similar), not a one-off fluke.
`enforceAppCheck: true` removed from all six functions and redeployed the same session it was
enabled, per the explicit commitment made before asking the user to test ("if you get an error...
I'll roll this back immediately"). The rollback's own first deploy attempt failed for an unrelated
reason (`Error generating the service identity for eventarc.googleapis.com` — transient GCP
provisioning, tied to `cleanupExpiredJobs` newly existing, not to this change); retried
immediately and succeeded. **Root cause not yet diagnosed** — this update does not explain *why*
attestation is unreliable, only that it demonstrably is, on real production traffic, today. Do
not re-enable `enforceAppCheck` on any of these six functions, and do not proceed to Firestore/
Storage "Enforce" in Console (a strictly larger version of the same risk), until that root cause
is understood. Candidates worth checking first, not yet checked: whether `isTokenAutoRefreshEnabled`
gives the SDK enough lead time to fetch a token before first use on a slow connection; whether the
reCAPTCHA Enterprise key's authorized domains are complete; whether a stale/cached token from
before this key was correctly registered was still in play on the device that failed.

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

**Update, 2026-08-29 — confirmed the association's own register; built the matching aid.** The
chapter confirmed this list came from the association's own register, and asked specifically for
what this ADR's Consequence section already named as the legitimate use: an admin-facing check
during verification, not a public listing. Built as `registerEntries/{id}` (Admin SDK only,
`allow read, write: if false` unconditionally — no client, exec or admin included, can ever read
it) and `lib/data/registerMatch.ts`, a fuzzy token-overlap match (not exact string matching — the
source list's formatting is too inconsistent for that to work) surfaced as an "In register" /
"Not found in register" hint next to each pending signup on `/admin/verification`. It is
deliberately still a hint, not a gate: it doesn't block or auto-approve anything, and the admin's
own judgement remains the actual check, same as before this existed. `scripts/import-register.ts`
(same `FIREBASE_SERVICE_ACCOUNT_B64`-gated, run-by-hand pattern as `grant-admin.ts`) loads
`data/roster-doctors-list-2026.csv` into Firestore. This still doesn't solve "members who will
never self-register" — the bulk pre-verification idea above remains unbuilt and would need its
own plan — but it does make the verification step this ADR already relied on meaningfully faster
and more reliable than a side-by-side spreadsheet.

---
## ADR-025 — Signup's two writes are one batch; the sign-in cap is 10/day and no longer swallows unrelated errors
**Context.** The first real signups went out to chapter officials on 2026-08-29 and two of the
three failed, in two different ways.

One official was told *"Too many sign-in emails requested for this address today"* — our own
message, from `emailLinkAttempts` (ADR-010), not Firebase's quota. Two things made that cap worse
than intended. It counts **attempts, not delivered emails**, so a member whose link lands in spam
spends the budget re-requesting it; and `recordEmailLinkAttempt()` caught *every* error from that
Firestore write and reported all of them as the cap, so an offline member — or one denied for any
unrelated reason — was also told to come back tomorrow. Hitting it is a dead end by design: the
counter is unreadable and undeletable from the client, so nobody, including an admin, could clear
it without the console.

The second official reached `/pending` and saw "we're reviewing your application", while the
admin queue stayed empty. Signup did two sequential client writes — `members/{uid}` then
`verificationRequests/{id}` — and the two halves are read by *different people*: `/pending` reads
the first, `/admin/verification` reads the second. Anything interrupting the gap (a closed tab, a
dropped connection) strands the member in a state neither view can detect. The wider version of
the same gap: the signup draft (name, department, folio) lives in `localStorage` on the browser
the form was filled in, but the link arrives by email — tap it in Gmail, re-open it in Chrome,
and `readSignupDraft()` returns null. That fell through to the returning-member path, which signs
the account in, writes **nothing**, and lands them on `/pending`. Their folio number was simply
discarded, silently, and no admin ever saw a request.

**Decision.** Four changes, none of which move the trust boundary.
1. `registerNewMember()` (`lib/data/members.ts`) commits the profile and the verification request
   in **one `writeBatch`** — both or neither. It replaces `createMemberProfile()` +
   `submitVerificationRequest()`, which no longer exist separately. Rules still evaluate each
   document independently, so nothing is weakened by batching.
2. A signed-in account with **no member profile** is now a recognised state, not a fall-through.
   `SignupForm.tsx` gains a `complete-profile` stage that asks for the details again against the
   already-signed-in address — no second email link. `completeReturningSignIn()` returns the uid
   alongside the destination so the form can tell "waiting on a decision" from "never applied".
   `/pending`'s no-profile screen points there instead of only at WhatsApp.
3. The daily cap goes 5 → 10, and `recordEmailLinkAttempt()` reports the cap **only** on
   `permission-denied`; everything else is rethrown for `describeSignInError()` to classify.
   Firebase's own per-address quota (`auth/too-many-requests`) now maps to the same copy, since
   it's the same situation for the member.
4. `scripts/reset-email-attempts.ts` clears a locked-out address without waiting for midnight
   Lagos time, and `scripts/repair-verification-requests.ts` files the missing request for any
   member already stranded by (1). Both follow `grant-admin.ts`'s run-by-hand,
   `FIREBASE_SERVICE_ACCOUNT_B64`-gated pattern; the repair script is dry-run unless `--apply`
   and prints uids only, never names, emails or folio numbers.

**Consequence.** 10/day is still a guess, not a measurement — it's chosen to survive a spam-folder
round trip, and Firebase's own quota sits underneath it either way. The cross-device recovery asks
the member to retype three fields; the alternative, carrying the draft through the link URL, would
put personal data in an email and a browser history for no real gain (NDPA 2023, `docs/08-NDPA-
COMPLIANCE.md`). Note what is *not* claimed here: the admin queue still reads only
`verificationRequests`, so it remains possible in principle for a pending member to be invisible
to an admin — the batch closes the way that used to happen, it doesn't make the two collections
one. If it recurs, the honest fix is to derive the queue from `members.status == "pending"` and
keep `verificationRequests` purely as the decision audit trail.

---
## ADR-026 — Email + password replaces email-link sign-in; the inbox leaves the critical path
**Context.** ADR-010 chose email-link (passwordless) sign-in, largely because ADR-007's phone OTP
needed Blaze billing before a single member could sign up. It noted the cost honestly: "email
deliverability in Nigeria is less reliable than SMS for some providers... Revisit if signup
completion rates suffer for it." The first real signups, sent to three chapter officials on
2026-08-29, gave us the measurement: **two of the three failed, and both failures were the
email round trip, not the code around it.**

One official requested five links and never signed in once — five sends, zero clicks, almost
certainly a spam folder. The other clicked his link in a different browser from the one he filled
the form in, which meant the `localStorage` signup draft wasn't there when the link opened; the
account was created, nothing was written, and he sat on `/pending` while the admin queue stayed
empty (see ADR-025, which closed the silent-failure half of that but could not remove the round
trip itself).

That round trip is the defect. Email-link auth requires the member to leave the browser, find a
message, and come back to *the same browser* — three steps we don't control, on a phone, on
expensive data. The chapter's own approval step, meanwhile, does not depend on the email at all:
an admin checks a folio number against the register (`CLAUDE.md` rule 5 — authenticated ≠
verified member). The email was never the thing establishing that someone is a Gombe doctor.

Also worth recording: **ADR-010's premise is stale.** This project has been on Blaze since Cloud
Functions were deployed. Billing no longer rules anything out, phone OTP included.

**Decision.** Email + password becomes the only sign-in method. Email-link is deleted, not kept
as a second path — two ways into one account is where ADR-025's bug lived, in a handler that
served both "new signup" and "returning sign-in" and told them apart by a `localStorage` key.
- Signup is one submit: `createUserWithEmailAndPassword`, then `registerNewMember()`'s batch,
  then the session. One browser, one session, no inbox.
- `lib/firebase/auth-password.ts` replaces `auth-email-link.ts`. `emailLinkAttempts` — its rules
  block, its tests, its reset script, and its production documents — is gone. Those document ids
  were email addresses, so once the feature went, so did any basis for keeping them.
- New `/reset-password` asks for the link only; Firebase hosts the page that sets the password,
  so there is no second screen to build. It never reveals whether an address has an account.
- Password rule is **length only, minimum 8**. No forced character classes, no low maximum —
  current NIST guidance, and what someone can actually type on an Android keyboard. Credentials
  are deliberately kept out of `memberSignupSchema`, whose parsed output goes straight into a
  member document.
- Console-side: email-link disabled on the Email/Password provider, email enumeration protection
  on. The error copy assumes the latter — wrong-password and no-such-account collapse into one
  message, because distinguishing them turns the sign-in form into a membership oracle.

**Consequence.** Email is now needed for exactly one flow: a forgotten password. That's rare and
the member is motivated to go digging in spam, unlike a sign-in they do every time. Deliverability
is still worth fixing (custom sender domain) but it is no longer load-bearing.

What we give up: **email addresses are no longer proven.** Anyone can register with a typo or with
someone else's address. We accept that deliberately rather than adding a verification email, which
would put the inbox straight back on the critical path we just removed — and the folio review is
the check that actually matters. The cost lands on one person at a time: a member with a typo'd
address can't self-serve a password reset and has to reach the secretariat. The address is visible
in the verification queue, so an admin can catch an obvious mistake before approving.

The `complete-profile` recovery stage from ADR-025 survives, with a different job. Account creation
and the profile write are still two operations against two services, so an account can exist with
no profile if the second fails. That state is recognised and recoverable rather than silent — but
note it is now the *only* way a member can be invisible to the admin queue, and it is a genuine
failure, not a routine one.

Two accounts predated this (the admin's and one official's) and had no password; both were given
one directly via the Admin SDK rather than through a reset email, because how Firebase treats a
password reset on an email-link-only account is exactly the kind of thing `CLAUDE.md` says not to
guess at during a migration people are depending on.

---

## ADR-027 — `/verify` looks members up by an opaque token, not folioNumber
**Context.** An independent engineering audit (2026-09-03) found that `/verify/[folio]` read
`members` directly by `folioNumber` and rendered any member's name, grade, facility and status to
an unauthenticated visitor — while `/privacy` told members nothing appears publicly "and only if
you explicitly opt in." `folioNumber` is `NMA/GM/nnnn`, a few hundred sequential values, and there
is no rate limiting anywhere in this codebase (a separate, tracked gap — see the audit's F-05).
The whole roster, including members who deliberately left the public directory unchecked, was
walkable in minutes by anyone who tried the URL pattern, no card required. ADR-019's fix (real QR
generation, replacing the earlier `QrPlaceholder()`) had made this concretely exploitable rather
than academic — a real, scannable QR was already shipping, encoding the same enumerable key.

Gating the lookup on `publicListingConsent` was considered and rejected: it would have broken the
legitimate case this page exists for — a doctor hands you their card, you scan it, it verifies —
for every member who opted out of the *directory* specifically, which is a different decision from
"can prove membership to someone I've shown my card to." The actual defect was the identifier, not
the absence of a consent check on top of it.

**Decision.** `members/{uid}` gains `verificationToken` — an opaque, high-entropy id
(`crypto.randomBytes(16).toString('base64url')`, 128 bits), minted once by `decideVerification`
(`functions/src/verification.ts`) the first time a member is approved, guarded on the field being
absent so a later rejection-then-reapproval never mints a second token and orphans a card already
handed out. It is a trust field — added to `noTrustFieldChanges()`'s diff check alongside `status`/
`role`/`duesPaidThrough`/`verifiedAt` — so no client write path can ever set or overwrite it,
including the member's own. `/verify/[folio]` becomes `/verify/[token]`; `lookupByFolio` becomes
`lookupByToken`, querying `verificationToken` instead. `toStoredFolioNumber` (the hyphen/slash
round trip folio numbers needed to survive as a URL segment) is deleted entirely — a token has no
slashes, so the thing it worked around no longer exists. Every card-rendering surface (`FolioCard`,
the download route, the homepage's own-card fetch, the verify OG image) now encodes the token, not
the folio number, into the QR/link.

Pre-existing verified members needed a one-time backfill (`scripts/backfill-verification-tokens.ts`)
before the folio-based route could be removed. Rollout order mattered: rules deployed first (so the
trust-field guard was live before anything else touched the field — the `affectedKeys().hasAny()`
diff makes adding a never-yet-written field a no-op for every existing flow, so this cost nothing),
then the backfill, then the Functions change, then the app. The Admin SDK bypasses rules regardless,
so the backfill's own access was never gated by this ordering — it closes the window on the client
side specifically.

The response `/verify/[token]` returns was also reduced. **Facility is dropped** — it isn't needed
to prove "this is a real, current member," and it was the field most entangled with
`publicListingConsent`, so showing it here regardless of that flag was the sharpest edge of the
original problem. **Folio number is kept**, deliberately reversed from the audit's own suggested
fix: the person scanning is holding the card, which already shows the folio, so echoing it back
discloses nothing new to the intended audience; MDCN operates a public register of licensed
practitioners, so folio numbers are not secret information; and it's the identifier Nigerian
institutions actually recognise — a verification page that omitted it would read as less
authoritative to the hospital administrator or checkpoint officer who is the actual user of this
page. The enumeration risk this ADR closes came from folio number being a *lookup key*, not from
it being *visible* — once it stops being the key, showing it costs nothing and keeps the page
useful.

**Consequence.** Every card in circulation before this shipped stopped resolving the moment the
folio-based route was removed. At the time this shipped, the only person known to have downloaded
a card was the person who built this feature — there is no analytics or download logging anywhere
in this codebase to confirm that with certainty either way, which is itself a gap the audit named
(see the "no error monitoring, no logging" finding). The decision was to proceed regardless:
enumeration of the entire chapter roster outranks a handful of dead cards, and any card that did
leak invalidates and gets re-issued for free, automatically, the moment its owner reloads
`/portal/card`.

**Known gap, deliberately not built here.** There is currently no way to rotate a member's token if
one is ever exposed independent of the member's own status — `setMemberStatus`'s `suspended` state
handles "no longer a member," but not "this specific link leaked and the member is otherwise fine."
An admin-triggered `rotateVerificationToken` callable, mirroring `setMemberStatus`'s authorisation
pattern, is the obvious shape for this. Recorded here as a known gap rather than built now.

---

## ADR-028 — `/` and `/events` regenerate every 5 minutes; a build-time Firestore error degrades to empty rather than failing the deploy
**Context.** The same audit found `/` and `/events` prerendering with no `revalidate` and no
`dynamic` export — confirmed against the actual build's `prerender-manifest.json`, not assumed
from the code. Neither page reads `cookies()`, `headers()`, or `searchParams`, so both are static
snapshots frozen at whatever was in Firestore at the last `next build`. An exec publishing a
communiqué or an event changes Firestore and nothing else; the public page doesn't move until the
next unrelated deploy. `/news` (which takes `?category=`) was already dynamic and unaffected — this
was specific to the two pages with no query-string escape hatch. This also explains a debugging
detour from earlier in the project: pages that appeared to render fine were, in fact, rendering
stale, which looks identical to "working" until you know to check the timestamp.

**Decision.** `export const revalidate = 300` on both — ISR, not `dynamic = 'force-dynamic'`. Five
minutes is a deliberate choice, not a default: chapter content publishes rarely enough that
sub-minute freshness has no real value, and `force-dynamic` would move both pages onto every-request
Firestore reads with no `.limit()` on either query (see the audit's F-13, unbounded list reads,
tracked separately) — `revalidate` gets freshness without turning two of the highest-traffic public
pages into a query-per-visit cost.

Wrapped the same two `await` calls in `try/catch`, falling back to an empty result (no communiqué
section on `/`, "No upcoming events" on `/events` — both are existing, already-designed empty
states, not new UI) rather than letting the error propagate. With `revalidate` enabled these pages
still prerender once at `next build` before ISR takes over, so a transient Firestore hiccup during
that build step would otherwise fail the entire deploy over data that would have revalidated itself
within five minutes anyway. Scoped to these two call sites, not pushed into `lib/data/news.ts` or
`events.ts` themselves — other callers (`/news`, the admin list views) should keep failing loudly;
degrading silently is specifically the right trade-off for a build-time prerender path, not a
general property either repository function should have.

---

## ADR-029 — `projectMember` gets its own test package, because rules can't cover it

**Context.** `onMemberWrite` (`functions/src/directory-projection.ts`) is the only code deciding
what a member's profile projects into `directoryEntries` (every verified member) and
`publicDirectory` (opted-in members only) — including which fields are *absent*, not merely masked.
It is Admin SDK code, so `firestore.rules` and its ~150-assertion test suite cannot exercise it at
all; that suite is excellent and gives a strong impression of coverage, but it is testing a
different boundary. Before this ADR, `onMemberWrite` had zero tests of any kind, and no test
directory existed under `functions/` — the audit that found this called it the single highest-risk
untested path in the codebase: a one-character regression (`visibility.phone` → `after.phone`, or
dropping the `else { publicRef.delete() }`) would ship green through typecheck, lint, build, every
rules test, and every smoke test, and publish the phone numbers of doctors who explicitly opted out.

**Decision.** Split the trigger in two: `projectMember(db, uid, after)` — a plain async function
holding all the actual projection logic — and `onMemberWrite`, now a two-line wrapper that reads the
event and calls it. This means the logic can be tested by calling it directly against a real
Firestore emulator via the Admin SDK, without needing the Functions emulator's event-dispatch
machinery to actually fire a trigger — faster, and the emulator setup this project already runs for
`tests/rules` covers it with no new infrastructure beyond Jest itself.

`functions/` gets its own Jest setup (`jest.config.ts`, `tsconfig.test.json`, `test/`) — a separate
package with its own `package.json`, so this doesn't touch the root project's Jest config or count
against its route/bundle-budget tooling. Six cases in
`functions/test/directory-projection.test.ts`, asserting **exact key sets** on both projected
documents (not just "contains the right field" — a leaked extra key would pass a subset check and
fail this one): not-yet-verified members project into neither collection; a verified member with no
consent gets a `directoryEntries` doc and no `publicDirectory` doc; consent alone produces the
minimal public field set; contact-field visibility flags populate `directoryEntries` regardless of
consent; and — the case that matters most — **visibility and consent both on still never puts
phone, whatsapp, or email into `publicDirectory`**, which is the exact invariant the source comment
claims and the one a careless edit would silently break. Every case also asserts `verificationToken`
(ADR-027) is absent from both projections, since the same one-object-literal design that keeps
contact fields out is what keeps the token out too, and it's worth proving rather than assuming.
A seventh case confirms suspension removes a member from `directoryEntries`, not only
`publicDirectory` — the ADR-014 behaviour the source comment describes.

Wired into CI as three new steps in the existing `verify` job: install `functions/`'s own
dependencies (a separate package, not covered by the root `npm ci`), build it, then run its tests
inside the same `firebase-tools emulators:exec --only firestore` wrapper the rules-test step already
uses.

**Consequence.** This is the first and only test coverage any Cloud Function in this project has.
The other five (`decideVerification`, `logBroadcast`, `setMemberStatus`/`setMemberRole`,
`markAttendance`/`unmarkAttendance`, `cleanupExpiredJobs`) remain untested — `projectMember` was
prioritised because it is the one enforcing a privacy invariant with no other backstop, not because
the others don't need coverage. Extending this same pattern (extract the logic, test it directly
against the emulator) to the rest is future work, not done here.

---

## ADR-030 — Scheduled Firestore backups: daily, 7-day retention, no restore rehearsed yet

**Context.** This project holds regulated personal data (NDPA 2023) — names, phone numbers, MDCN
folio numbers, CPD records — for every member, with no backup and no documented recovery path.
`firebase.json` had no export configuration, no script under `scripts/` performed one, and the only
mention of export/import in `docs/09-DECISIONS.md` (ADR-008) was in the context of changing region,
not disaster recovery. The concrete recovery path for a bad write — an `onMemberWrite` regression
emptying `directoryEntries`, an accidental re-import overwriting `registerEntries` — was "re-derive
from whatever still exists, or ask members to re-enter it." An audit named this as a High-severity
absent control.

**Decision.** Firestore's native managed backup feature (not a manual `gcloud firestore export` to a
GCS bucket — a fully-managed, Google-operated schedule against the database itself), confirmed real
and current directly from the installed `firebase-tools` CLI's own `--help` output before running
anything, per `CLAUDE.md`'s rule against guessing Firebase API details:

```
npx firebase firestore:backups:schedules:create --recurrence DAILY --retention 7d
```

Verified live afterwards with `firestore:backups:schedules:list` — `DAILY` recurrence, `604800s`
(7 days) retention, against `projects/nma-gombe-c5a9d/databases/(default)`. One schedule, no
Cloud Scheduler, no Cloud Function, no GCS bucket to manage or pay for separately — Google retains
the backups and bills for their storage against the project directly.

**Retention is 7 days, not longer, and this is a starting point, not a considered final value.**
Chosen as the conservative, low-cost default for a first backup where none existed at all — matches
this project's general cost-consciousness (small chapter, Version-3-deferred dues) rather than a
deliberate analysis of how far back a real recovery might need to reach. Revisit if that's wrong;
`firestore:backups:schedules:update` changes it without recreating the schedule.

**Recovery procedure — the actual verified command, not a guess:**
```
npx firebase firestore:databases:restore --database <target-database-id> --backup <backup-name>
```
`<backup-name>` is a specific backup's full resource path, from `firestore:backups:list`.
**Important, and not yet rehearsed:** per the CLI's own `--help`, this restores a backup *into* the
database id you specify — it is not demonstrated here whether that can target the live `(default)`
database in place while the site is operating, or whether recovery in practice means restoring into
a new database id and then migrating/re-pointing the app at it. Firebase's own docs (not re-derived
here — check them at the time of an actual incident) are the authority on this, not this ADR. Until
a restore has actually been rehearsed once against a non-production project, treat "we have backups"
as true and "we know how to recover from them under pressure" as not yet true.

**Consequence, NDPA-relevant.** A member's data now persists in a daily snapshot for up to 7 days
after it's changed or deleted in the live database — including after a manual erasure request
(`docs/08-NDPA-COMPLIANCE.md`'s only deletion path today, since no `deleteMember` Function exists —
see ADR-027's sibling gap, F-04b, still open). This is a genuine, if small, extension of how long
data can persist after a deletion request, and is disclosed in `08-NDPA-COMPLIANCE.md`.

**Deliberately not done here:** the deletion Function itself (F-04b) — recorded as a known gap, with
the manual per-collection erasure checklist added to `08-NDPA-COMPLIANCE.md` instead, so a request
is at least repeatable in the meantime.

---

## ADR-031 — Documentation drift correction pass, and a CI check that stops it recurring

**Context.** An independent audit (2026-09-03) found several documents asserting controls that
never existed, or that existed once and stopped being true without the doc catching up:
`docs/03-DATA-MODEL.md`'s threat model claiming "App Check enforced... rate-limited search" as
active mitigations (App Check was enforced for one day — ADR-020 — and rolled back; rate limiting
has never existed); `docs/06-ROADMAP.md` repeating the same "rate-limited search" claim as a
scraping mitigation; `docs/10-TEST-PLAN.md` claiming an automated axe accessibility pass runs in
CI (no `axe-core` dependency exists anywhere in the repo, no CI step); the README instructing a new
developer to provision two Firebase projects and Paystack test keys — both directly contradicting
settled decisions (ADR-009: one project, not two; ADR-021: dues indefinitely deferred, no Paystack
code exists); and the matching claims in `docs/02-ARCHITECTURE.md` and `docs/00-INTAKE.md`'s
developer-prerequisites section, neither of which had received the strikethrough-and-annotate
treatment the rest of `00-INTAKE.md` already uses for resolved/superseded items.

The person who commissioned that audit put it plainly: things written into these docs as
*requirements* — "App Check enforced," "rate-limited search" — got read forever after as
*descriptions* of what the system does. That's the actual failure mode, not carelessness in any
one edit: a requirements doc and a systems-truth doc were never distinguished from each other, so
drift between "what we said we'd build" and "what got built" had nowhere to surface.

**Decision, in two parts.**

**Part one — the corrections themselves**, each checked against the actual code before being
rewritten, not against another doc: `docs/03-DATA-MODEL.md`'s threat model became a table (see
below); `docs/06-ROADMAP.md`'s "Directory scraped" row now states which of its four named controls
are actually live and which aren't; `docs/10-TEST-PLAN.md`'s accessibility section now says plainly
that axe automation doesn't exist; the README's setup instructions describe the real one-project,
no-Paystack-keys setup; `docs/02-ARCHITECTURE.md`'s payments section and environments section are
now explicitly marked as deferred design and corrected fact, respectively, rather than left to read
as current behaviour; `docs/00-INTAKE.md`'s developer-prerequisites section got the same
strikethrough-and-supersession treatment its own earlier items already model.

**Part two — the structural fix**, so this stops being something that has to be caught by hand.
`docs/03-DATA-MODEL.md`'s threat-model prose became a table: **Control | Status | Proof**, where
Status is one of `Implemented` (exact string), `Implemented (architectural)` for a true-but-not-
test-provable claim like "no bulk-read endpoint exists," or `Intended`. `scripts/check-threat-model.mjs`
— same shape as `check-routes-built.mjs`, which already does this for `05-ROUTES.md`'s `[Built]`
tags — parses the table and fails the build if any row tagged exactly `Implemented` doesn't name a
real, existing test file in Proof. Verified both directions before trusting it: a deliberately
broken Proof path (pointed at a file that doesn't exist) failed the check with a clear message;
reverted, it passes. Wired into `npm run check:threat-model` and a new CI step, right after the
existing routes-doc check.

**What this check does not do**, stated plainly so it isn't mistaken for more than it is: it
doesn't verify a named test file actually tests the claimed control correctly, doesn't catch a
control that's quietly become false while its test still passes against stale assumptions, and
doesn't judge whether `Intended` is still the honest tag for something that should have shipped by
now. Same limitation `check-routes-built.mjs` already has for `[Built]` tags — a filesystem-existence
check, not a semantic one. It closes exactly one failure mode: a row hand-typed as `Implemented`
with no test ever written to back it, silently trusted because it read like every other row.

**Consequence.** Five threat-model controls are honestly `Implemented` today, with real tests
behind each: `verified()` gating (`tests/rules/firestore.test.ts`), per-field visibility and
consent (`functions/test/directory-projection.test.ts`, new as of ADR-029), the opaque `/verify`
token (`tests/rules/firestore.test.ts`, ADR-027), and the trust-field write guard (same file). At
the time this ADR was written, rate limiting was also honestly `Intended`, alongside App Check
enforcement — neither closer to built because of this pass, which corrects what the documents
claim rather than implementing what they were claiming. Rate limiting has since moved to
`Implemented (partial)` (F-05, `src/proxy.ts`) — see ADR-032. App Check enforcement remains
`Intended`; that work is tracked separately, and ADR-020's root-cause question is still open.

---

## ADR-032 — Crude per-IP rate limiting in `proxy.ts`, and a deliberate scope boundary

**Context.** No rate limiting existed anywhere in this codebase, on any endpoint — confirmed by
grep, not assumed. `src/proxy.ts`'s matcher covered only `/portal/:path*` and `/admin/:path*`, for
authorisation gating; the routes an audit named as concretely exposed by that absence —
`/verify/[token]`, `/doctors`, `POST /api/session`, and the rest of `src/app/api/*` — were outside
its reach entirely.

**Decision.** Widened the matcher to also intercept `/verify/:path*`, `/doctors`, and `/api/:path*`,
but did **not** fold them into the existing `/portal`/`/admin` branch — a new, separate branch
inside `proxy()` handles rate limiting only, leaving the auth-gating branch (and every test that
already covered it) untouched. Confirmed with a dedicated test: an IP already past the rate limit
on `/doctors` still gets normal `/portal` auth-gating (a 307 redirect to `/signin`), not a 429 —
proving the two branches genuinely don't share logic, not just asserting it from reading the code.

The limiter itself: an in-memory `Map`, keyed by `x-forwarded-for`, 60 requests per 60-second
window, shared across all three route groups per IP (not a separate bucket per route). Deliberately
**not** extended to `/portal` or `/admin`: the abuse this guards against — scripted token-guessing
against `/verify`, expensive `/doctors` queries, unauthenticated floods against `/api/session` — is
a request-volume problem visible at the proxy layer. A member spamming Firestore writes
(`jobs`/`cpdEntries`/`welfareCases` creates) via the client SDK from an authenticated `/portal`
session is a different problem this layer cannot see at all — those writes never touch `proxy.ts`.
Extending the matcher there would have added rate limiting that stops nothing real while risking
the one thing that must never regress: `/portal`/`/admin` auth gating.

**Consequence, stated as plainly as ADR-030 stated backup's limits.** This is genuinely crude, not
a considered rate-limiting design: Vercel can spread a burst of requests across multiple serverless
instances, each with its own empty `Map`, so a distributed script defeats it trivially; every count
resets on a cold start or redeploy; and it has no reach into the client-SDK write paths named above
at all. `docs/03-DATA-MODEL.md`'s threat-model table tags this row `Implemented (partial)` —
deliberately not the exact string `Implemented`, so `check-threat-model.mjs` (ADR-031) doesn't hold
it to a bar it honestly doesn't clear. It beats the nothing that existed before, for the routes it
does cover, and no more than that.

**Correction, found the day after this shipped.** The full smoke suite broke — 7 of 29 tests, all
with `429` console errors — the first time it ran against this change after it landed. Root cause,
found by direct repro against a real running server rather than guessed from reading the code: on
the Node runtime, when nothing upstream sets `x-forwarded-for`, Next fills it in from the raw
socket address rather than leaving it absent — `::1` locally, and the same loopback value in CI,
since Playwright's browser also connects over loopback. Every request in local dev and CI therefore
shared one bucket regardless of which of dozens of concurrent, unrelated requests sent it — a
legitimate parallel-test-worker request volume, not an abuse pattern, tripped the same limit meant
for a scripted attacker.

The first attempted fix exempted the literal string `'unknown'` (the case where the header is
genuinely absent) — shipped, then re-tested with the same direct-repro method (curl in a loop
against a real server, not just trusting the diff), and it didn't hold: `clientIp()` never actually
returns `'unknown'` in this runtime, because the header is never actually absent. Diagnosed properly
by logging the resolved value server-side rather than guessing again — confirmed `::1` — before
writing the real fix: exempt loopback addresses (`::1`, `127.0.0.1`) specifically, alongside the
already-correct `'unknown'` case. Re-ran the exact same repro (0/100 requests rate-limited, versus
40/100 before) and the full smoke suite (29/29) before trusting it this time. Costs nothing in
production: Vercel's edge always sets this header to the real internet-facing client IP for a real
external request, never a loopback address, so exempting loopback can never let a real attacker
through.

The lesson this cost a day to learn: `npm run test:smoke` was not re-run after this change shipped,
only `typecheck`/`lint`/`build`/`check:budget`/unit tests — the exact gap the smoke suite exists to
close (`tests/smoke/pages.spec.ts`'s own header: "invisible to tsc, eslint and unit tests"). A
change to `proxy.ts`, which every single request in the app passes through, is precisely the
highest-blast-radius class of edit this project has, and it shipped without the one check that
would have caught it same-day instead of next-day.

---

## ADR-033 — Rules test suite gets `list`/query coverage for every `allow list` clause

**Context.** `tests/rules/firestore.test.ts` had ~150 assertions and none of them issued a `list`
or a `query` — every one was a single-document `get`/`set`/`update`/`delete`. Firestore evaluates
`get` and `list` differently: a `list` (a query against a collection) is only permitted if the
security rule can be **proven** true for every possible result using nothing but the query's own
filters — it cannot inspect each candidate document's data the way `get` can. A rule written as
`isSelf(uid)` on a top-level collection has an unbound `{uid}` at list time, so Firestore can never
prove it and denies the query outright — in practice correct, but by evaluation failure, not by
anything this suite had ever demonstrated. An audit named this the highest-value addition available
to an otherwise strong suite: a future edit that widened any `allow list` clause — turning
per-document access into bulk extraction, the single most damaging class of rules change possible —
would have passed every existing test in the file untouched.

**Decision.** A new section, ten `describe` blocks, one per collection carrying an `allow list` (or
an `allow read`, which is shorthand for `get, list`) grant: `members`, `directoryEntries`,
`payments`, `duesRates`/`events`/`jobs`/`documents` (grouped — all doc-independent grants), `news`
(status-filtered), `broadcasts`/`welfareCases` (exec-only), `registrations`, `cpdEntries`, and the
two fully-closed collections (`publicDirectory`, `registerEntries`) confirmed denied at the list
level too, not just the get level already covered. 34 new assertions, `getDocs`/`query`/`where`/
`documentId`/`collectionGroup` newly imported — none of it previously exercised in this file.

Every non-obvious claim was verified empirically against the real emulator, not asserted from
memory of how Firestore rules are supposed to work — several turned out to matter:
- **`members`**: an unconstrained list fails for a member (`isSelf(uid)` unprovable), but a query
  constrained by `where(documentId(), '==', uid)` succeeds — the exact provable-query shape the
  denial depends on, now demonstrated rather than assumed.
- **`payments`**: same shape — unconstrained list fails even for the payment's own owner, but
  `where('uid', '==', ownerUid)` succeeds, and `where('uid', '==', someoneElse)` fails even though
  it's a syntactically valid query the same owner could technically issue.
- **`registrations` diverges from `payments`** in a way worth its own test: `payments` grants `get,
  list` under one combined condition, but `registrations` splits them — `list` is `isAdmin()` only,
  with no self-uid carve-out at all. A member can reach their own registration by its known
  deterministic id (`get`) but can never query for it, even filtered to their own `uid` field —
  confirmed, not just read off the rules file.
- **`cpdEntries`**: the file's own comment claims no collection-group view exists for an aggregate
  CPD report across members. Tested directly: even admin's `collectionGroup(db, 'entries')` query
  is denied, because no `match /{path=**}/entries/{id}` rule exists to permit it — the claim held.
- **`directoryEntries` and `jobs`**: unconstrained list succeeding for any verified member isn't a
  gap — it's the real app's own usage (`DirectoryView.tsx`'s whole-collection subscription,
  `JobsBoard.tsx`'s listing), now the suite proves the rule actually permits what the app does,
  rather than the app's own working state being the only evidence the rule is right.

**Consequence.** 163 tests total, up from 129 before ADR-027/028/029's additions and this one
combined. No rule was changed to make a test pass — every result matched what `firestore.rules`
already specified; this closes a coverage gap, not a security gap that turned out to exist. The
next person who widens an `allow list` clause without meaning to now finds out from `npm run
test:rules`, not from someone else finding it first.

---

## ADR-034 — Five findings, accepted as-is rather than fixed: pagination, CSP, CPD certificate URLs, dependency advisories, the deletion Function

**Context.** An independent audit (2026-09-03) raised 25 findings. Twenty were acted on
(ADR-027 through ADR-033, plus the accessibility and header fixes that didn't need their own
ADR). Five were deliberately not — not overlooked, decided against building right now, for
reasons worth recording so the next person doesn't have to re-derive them or wonder whether
they were simply missed.

**1. Pagination (F-13) — not built.** Every server-side list read in `lib/data/*` is unbounded:
confirmed again before writing this ADR, not assumed from the audit — `publicDirectory.ts`,
`membersAdminServer.ts`, `verificationAdmin.ts`, `documentsAdmin.ts`, `welfareAdmin.ts`, and
`broadcastAdminServer.ts` all still read their entire collection with no `.limit()`, as does
`news.ts` (feeding both `/news` and, since ADR-028, the homepage's 5-minute-revalidated read).
`verificationAdmin.ts` additionally does one extra `members/{uid}` read per historical row, and
that collection is never pruned (`allow delete: if false`, kept as an audit trail) — the one of
these seven that gets strictly worse with age, not just linearly more expensive. Accepted because
at current scale (a few hundred members, ADR-027's backfill touched exactly ten verified ones)
every one of these reads costs nothing worth optimising for. This is scale-dependent debt, not
free: revisit before, not after, the chapter's roster or its verification-request history grows
by an order of magnitude. `directory.ts`'s client-side whole-collection `onSnapshot` is explicitly
excluded from this concern — it's real, offline-first design (ADR-033 confirmed the rule permits
exactly this), not an oversight sharing the same shape.

**2. Content-Security-Policy — not added.** `next.config.ts` sets every other header this audit
recommended (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
and now `Strict-Transport-Security`), deliberately stopping short of CSP. This codebase uses
inline `style={{...}}` extensively and on purpose — design tokens are threaded through components
as inline styles throughout `src/`, not a CSS-class convention — which means any CSP would need
`style-src 'unsafe-inline'`, giving up most of CSP's actual value against injected styles before
it starts. A `script-src` policy with a nonce would still be worth having on its own (it would
have closed the class of bug F-15 named — an unvalidated `href` in the markdown renderer,
separately fixed by allowlisting schemes rather than by CSP), but Next's own inline bootstrap
scripts need a nonce threaded through `next.config.ts` and the root layout correctly for that to
work without breaking the app, which is real, measured work, not a header to copy in. Accepted as
follow-up: a report-only `script-src` policy first, to see what it would actually break before
enforcing anything.

**3. CPD certificates via `getDownloadURL()` (F-09) — not fixed.** `lib/data/cpd.ts` still calls
`getDownloadURL()` after upload, storing the resulting token-bearing URL as `certificateUrl` —
confirmed still true, not assumed. `storage.rules`'s own opening line says "unguessable URLs are
not security," and ADR-022 rejected exactly this pattern for guideline files for exactly this
reason: the token authorises the object forever, independent of `storage.rules`, independent of
whether the member is still verified. The fix is a known, already-proven shape — mirror the
guidelines Route Handler pattern (`portal/documents/[id]/download/route.ts`), which already does
this correctly for a different collection. Not done here because the exposure is narrower than
guidelines (a CPD attendance certificate, not clinical content) and because fixing it doesn't
just mean shipping new code — every `certificateUrl` already issued needs its token revoked in
Firebase Console for the fix to actually close the gap, an operational step alongside the code
change, not a pure refactor. Accepted as a known gap with a known fix, deferred rather than
designed around.

**4. Dependency advisories (F-23) — not remediated, but no longer silently accumulating.**
`npm audit` today: 18 advisories, 1 high, 17 moderate (re-run before writing this ADR — same
counts as the audit found). The one high (`fast-uri`, via `firebase-tools` → `ajv`) is
confirmed unreachable in production (`npm ls fast-uri --omit=dev` returns empty; `firebase-tools`
is a devDependency, used only for emulators and deploys). The moderates are transitive under
`firebase-admin`'s Google Cloud client libraries or `firebase-tools` itself, none reachable with
attacker-controlled input in this codebase. None of the 18 individually justified an emergency
`npm audit fix --force` (which would pull a breaking `firebase-admin` downgrade to clear the
`uuid` chain). What changed instead: `npm audit --audit-level=high --omit=dev` is now a real CI
gate (see the header/CI fixes alongside ADR-033), confirmed exit-0 against the current lockfile
before being wired in specifically so it polices *new* high/critical advisories in production
dependencies going forward, rather than relitigating these 18.

**5. `deleteMember` Function (F-04b) — not built; the manual path is at least repeatable now.**
`firestore.rules:38` still reads `allow delete: if false; // deletion is a Function` — no such
Function exists (`functions/src/index.ts` exports eight, none of them this one). A real erasure
request today means an admin touching eight separate locations by hand: `members/{uid}`, both
directory projections, the `cpdEntries` subcollection, `verificationRequests`, `registrations`,
`jobs`, `welfareCases`, and the Auth user itself. Rather than build the Function, the concrete
per-collection checklist was written into `docs/08-NDPA-COMPLIANCE.md` (alongside ADR-030's
backup work) so that manual process is at least complete and repeatable rather than whatever an
admin happens to remember — a real gap, closed for now, not conflated with the different gap of
not having automated it. Accepted because at current member counts a manual, checklist-driven
erasure is genuinely tractable and rare enough not to justify the engineering cost of a
transactional cross-collection delete Function yet; revisit if erasure requests stop being rare.

**Consequence.** None of these five is invisible: each has a named finding id, a real file or
number backing the claim, and a stated condition for when "accepted" should be revisited (an
order-of-magnitude growth in members or verification history for pagination; any move to enforce
a CSP for the markdown-XSS class of risk; an actual CPD-certificate leak report; a new *reachable*
high/critical advisory, which CI now catches; erasure requests becoming routine rather than rare).
Accepting a gap without writing down what would make it stop being acceptable is how "rate-limited
search" and "App Check enforced" ended up asserted as done for years — see ADR-031. This ADR is
deliberately written to fail that test.
