# 03 — Data model and security posture

## Threat model, stated plainly
The valuable asset is a verified list of doctors with phone numbers. That is worth money to
recruiters, drug reps, and scammers, and its exposure is an NDPA incident. Assume someone will
try to scrape it. Design accordingly: App Check on, per-field visibility, no bulk endpoint,
rate-limited search, and never a client-readable collection containing every member's phone number.

## Identity tiers
| Tier | How it is granted | Can see |
|---|---|---|
| anonymous | — | public pages, public verification page |
| `authenticated` | signup | own profile, dues payment, own card |
| `verified: true` | **admin approval after folio review** | member directory, jobs, CPD, member documents |
| `role: exec` | admin grant | welfare cases, member management |
| `role: admin` | admin grant | everything, verification queue, ledger |

`verified` and `role` are **custom claims** set only by a Cloud Function. They never live in a
client-writable document.

## Collections

### `members/{uid}`
```
displayName, department               // department = clinical specialty, free text.
                        // REQUIRED at signup — see ADR-014 on why specialty is captured then,
                        // not deferred to a profile form few members will return to complete.
folioNumber            // self-reported at signup. NOT cross-checked against any digitised
                        // roster — admin approves by matching name against the eligibility
                        // list and personal knowledge. See ADR-010.
email                   // also the sign-in identity (email-link auth, ADR-010)
facility                // optional at signup, editable in /portal/profile. Also shown to the
                        // admin as a cross-check against the eligibility list — ADR-014.
grade ("consultant"|"resident"|"medical_officer"|"house_officer"|"retired")  // set in
                        // /portal/profile — not collected at signup (ADR-014)
subspecialty, town, phone, whatsapp   // set later, in /portal/profile
visibility: { phone: bool, whatsapp: bool, email: bool, facility: bool }
publicListingConsent: boolean  // default false. Member-writable, NOT a trust field — but the
                        // onMemberWrite trigger only writes publicDirectory when this is true.
                        // Gates listing on the public, indexable /doctors page specifically;
                        // separate from the visibility flags above, which gate contact fields
                        // inside the member-only directory. See ADR-013.
status: "pending" | "verified" | "rejected" | "suspended"   // FUNCTION-ONLY in the general
                        // case, but this slice's rules allow a client `create` of exactly
                        // status:"pending" (no Function exists yet to do it instead — see
                        // docs/09-DECISIONS.md ADR-010). Every value after that is Function-only.
role: "member" | "exec" | "admin"                            // FUNCTION-ONLY, same carve-out
                        // as status above: client `create` may only set role:"member".
duesPaidThrough: number  // year, e.g. 2026                  // FUNCTION-ONLY
mdcnRenewalMonth: number // 1-12, member-entered, for reminders only. NO fees, NO payment.
createdAt, updatedAt
```
Read: self, and `role: admin`. Never readable in bulk by members — that is what
`directoryEntries` is for.

### `directoryEntries/{uid}`
The only collection members can query. Written **only** by the `onMemberWrite` Firestore trigger
(`functions/src/directory-projection.ts`) — fires on every `members/{uid}` write, not just
approval, so a profile edit after verification stays in sync instead of going stale. See ADR-014.
Upserted while `status === "verified"`; deleted otherwise (suspension/rejection removes the
member from the directory).
```
displayName, department, grade?, subspecialty?, facility?, town?
phone?, whatsapp?      // present only if that visibility flag is true
verifiedAt
searchTokens: string[] // lowercased name + department tokens for prefix search
```
Rationale: one document read per result, no joins, and a member's hidden fields are physically
absent rather than filtered client-side. If it is not in the document, it cannot leak.

### `publicDirectory/{uid}` — reserved, not yet populated (see ADR-013, ADR-014)
The data source for the public, unauthenticated `/doctors` page (not yet built). **No client
access at all** — `allow read, write: if false`. Read only via the Admin SDK from a Server
Component; there is no Firestore query a browser can issue against this collection, which is the
point: nothing to scrape, nothing to widen by accident.
```
displayName, department, grade?, facility?, town?, folioNumber
searchTokens: string[] // same shape as directoryEntries
```
Never phone, whatsapp, or email — no code path writes them here. Upserted by the same
`onMemberWrite` trigger, only while `status === "verified" && publicListingConsent === true`;
deleted the moment either flips false, so revoking consent removes the listing immediately.
`00-INTAKE.md` item 25 (exec-ratified consent language) is cleared; `/doctors` reads this
collection via the Admin SDK (`lib/data/publicDirectory.ts`), zero client JS, same posture as
`news`/`events`.

### `verificationRequests/{id}`
`uid, folioNumber, evidenceUrl?, submittedAt, decidedBy?, decidedAt?, decision?, note?`
Create: the requesting member. Read/update: admin only. Keep the audit trail — a rejected
doctor will ask why. `evidenceUrl` stays unused until Firebase Storage is provisioned
(currently on Spark, no bucket) — the admin verifies against the eligibility list and their
own knowledge for now, not an uploaded document.

`decidedBy`, `decidedAt`, `decision`, `note`, and `members/{uid}.status`/`verifiedAt` are written
only by the `decideVerification` Cloud Function (`functions/src/verification.ts`) — it's also the
only thing that can set the `verified:true` custom claim, since that's Admin-SDK-only. An admin
calls it from `/admin/verification`; there is no client Firestore write path for a decision.

Post-verification status/role changes (suspend, reinstate, grant/revoke a role) go through
`setMemberStatus`/`setMemberRole` (`functions/src/members.ts`), called from `/admin/members` —
same reasoning: each keeps the Firestore field and the actual custom claim in sync in one write,
which no direct client update can do. Granting `role:"admin"` specifically requires the caller
to already be `admin`, not just `exec` — an exec can suspend/reinstate and grant `exec`, only an
admin can mint another admin.

### `emailLinkAttempts/{email}/days/{yyyy-mm-dd}`
`count` (number), `lastAttemptAt`. Rate-limits `sendSignInLinkToEmail` — write-only from the
client, capped by the rules themselves (max 5/day), never read. Prevents a signup form from
being used to spam an inbox with sign-in emails. See ADR-010.

### `payments/{paystackReference}`
`uid, amountKobo, year, channel, status, paystackReference, paidAt, receiptUrl`
**No client writes, ever.** Document ID is the Paystack reference, which gives idempotency for
free when webhooks retry. Read: own payments, plus admin.

### `duesRates/{year}`
`{ grade: amountKobo }` — the server's only source of truth for price. Admin-writable, never
client-writable, and the client never sends an amount.

### `cpdEntries/{uid}/entries/{id}`
```
title, provider, creditUnits (number, 0 < n <= 100 — a sanity/anti-abuse bound, not a
                    claimed MDCN figure), dateAttended ("YYYY-MM-DD" string — a calendar
                    day isn't an instant, and a Timestamp would import a timezone question
                    with no correct answer; the string form also sorts lexicographically as
                    chronologically, so orderBy works unchanged)
certificateUrl?     // optional and addable after creation — certificate upload needs
                    // network, entry creation doesn't, so a member offline must be able
                    // to log the entry now and attach the file later
source ("chapter_event"|"self_reported")   // client can only ever write "self_reported",
                    // and it's immutable after create (firestore.rules). "chapter_event"
                    // entries are written only by markAttendance
                    // (functions/src/registrations.ts), via the Admin SDK — the doc ID is
                    // deterministic ({eventId}_{uid}, same reasoning as registrations
                    // below), so a double-mark overwrites the same doc rather than
                    // duplicating credit.
withdrawnAt?, withdrawnBy?   // set only by unmarkAttendance — see registrations below.
                    // Withdrawal never deletes the entry: a member may already have
                    // printed the CPD summary for MDCN, and a printed document silently
                    // going missing from the portal is worse than one that's visibly
                    // marked withdrawn. Excluded from the print view's total and entry
                    // list (it's not valid credit any more); still visible, labelled, in
                    // the on-screen log — the member should be able to see what happened
                    // to their own record, not have it quietly vanish.
createdAt
```
No client access beyond self, and only for `source == "self_reported"` — a `chapter_event`
entry is **immutable to the client entirely**, no update or delete, once markAttendance writes
it: `allow get, list: if isSelf(uid) && verified()`;
`allow create, update, delete: if isSelf(uid) && verified() && resource.data.source ==
"self_reported"` (create has no `resource.data` yet, so it's naturally exempt — a client can
only ever create a `self_reported` entry to begin with, enforced the same way as before). Without
this, a member could edit an exec-confirmed attendance entry's `creditUnits` or date after the
fact — the same integrity gap `source`'s create-time immutability already closes, just at the
wrong point in the lifecycle if update/delete aren't gated on it too.
`allow read: if isAdmin()` exists **only for a known uid** (e.g. an admin already looking at one
member from `/admin/members`) — there is no collection-group rule or index, so a query across
every member's CPD entries is not possible today and would need its own
`match /{path=**}/entries/{id}` rule plus a collection-group index. Deliberately not built:
nothing today needs an aggregate CPD view, and building the query path before there's a UI that
needs it just leaves an unused permission surface. Revisit only if that changes.

Self-reported entries are labelled as such on both the record and the printed export (see
`/portal/cpd`) — we record what the member tells us, we do not certify it, and the export says
so visibly, not just in the `source` field.

### `events/{slug}`
`title, slug, description (markdown), location, startAt, status ("draft"|"published"),
cpdCreditUnits?, lastEditedBy?, lastEditedAt?`
Single-step create-and-publish, same as `news` — still no draft or unpublish step in v1, but
publishing is no longer one-way: `PUT /api/admin/events/[slug]` (`lib/data/eventsAdmin.ts`'s
`updateEventAdmin`) lets an exec correct a mistake in place. The doc ID (`slug`) and `status`
never change on an edit — `registrations`, attendance, and `cpdEntries` are all keyed to the
slug, and changing it would orphan them. Public list orders by `startAt` ascending (a calendar
shows soonest-next, not most-recently posted); past events are removed by the admin, not
auto-hidden (`docs/07-CONTENT-OPS.md` quarterly review — "delete, don't archive"). `cpdCreditUnits`
is optional (unset = this event earns no CPD credit, e.g. a purely social event) and, like
`cpdEntries.creditUnits`, bounded `0 < n <= 100` in both Zod and firestore.rules — an exec
mistyping 500 instead of 5 shouldn't be storable. **Editing `cpdCreditUnits` only affects members
marked attended from that point on** — `markAttendance` snapshots `creditUnits` onto the
`cpdEntries` doc at the moment of marking rather than reading the event live at display time, so
a correction never retroactively rewrites credit already recorded. `lastEditedBy`/`lastEditedAt`
are set only by the edit path (absent on an item never corrected since publishing) — see
`docs/08-NDPA-COMPLIANCE.md`. Editing in place does not notify anyone who already saw the old
version — see `docs/07-CONTENT-OPS.md` on when a correction needs a broadcast, not just an edit.
`datetime-local` prefill on edit and the timezone assumption behind it: `docs/09-DECISIONS.md`
ADR-017.

### `registrations/{eventId}_{uid}`
```
uid, eventId
attended (boolean)
attendanceMarkedBy?, attendanceMarkedAt?     // set together, by markAttendance
attendanceUnmarkedBy?, attendanceUnmarkedAt? // set together, by unmarkAttendance — never
                    // clears attendanceMarkedBy/At, so the record shows both that
                    // attendance was marked and that it was later withdrawn, by whom, when
cpdEntryId?         // the linked cpdEntries doc's id — always {eventId}_{uid}, so this is
                    // derivable, but stored for the UI's convenience
```
Registration ID is deterministic (`{eventId}_{uid}`) to make double-registration impossible at
the rules level, not just by application-code convention. A member creates their own
registration directly (`allow create: if verified() && request.resource.data.uid ==
request.auth.uid` — not privileged, no Function needed, same reasoning as a member creating
their own `members/{uid}` doc at signup). Every field about attendance is Function-only:
`allow update: if false`, `allow delete: if isExec()` (cancelling/removing a registration
outright isn't a trust concern the way marking attendance is). `markAttendance` and
`unmarkAttendance` (`functions/src/registrations.ts`) are the only writers of the attendance
fields, and each writes the registration and the linked `cpdEntries` doc in the same Firestore
transaction — a transaction, not a batch, because the idempotency check (read current `attended`
state, act only if it's changing) needs the read to be part of the same atomic operation, not
just the writes. Two execs marking the same registrant at once resolve to one credit, not two,
for two independent reasons: the transaction serialises the read-then-write, and the CPD entry's
own doc ID is deterministic, so even a partial race just overwrites the same document.

### `news/{slug}`
`title, slug, body (markdown), excerpt, coverUrl, publishedAt, author, category ("communique"|"news"|"advocacy"|"obituary"), status ("draft"|"published"), lastEditedBy?, lastEditedAt?`
Same edit-in-place addition as `events` (`PUT /api/admin/news/[slug]`, `updateNewsAdmin`):
`slug`, `status`, `author` and `publishedAt` never change on an edit — a correction isn't a
re-publish, so it shouldn't reassign authorship or bump the item back to the top of a
newest-first list. `excerpt` is re-derived from the new body on every edit, or a body correction
would leave a stale preview.

### `jobs/{id}`
`title, facility, town, type ("locum"|"permanent"|"nysc"), description, contactVia, postedBy, expiresAt, status ("active"|"filled"), createdAt`
Doc ID is auto-generated — no natural unique key like a slug. `expiresAt` and `createdAt` stay
out of `jobSchema` (`lib/data/schemas.ts`), the same treatment `events.ts` gives `startAt`: real
Firestore Timestamps, not strings, so rules-level and query-level comparisons against
`request.time` work; attached per-file (`lib/data/jobs.ts`) instead of importing the Firestore
SDK's Timestamp type into the shared, SDK-free schema module.

**Every job expires, and the expiry is compulsory, not advisory.** A board full of dead listings
is worse than no board. Default expiry by type — locum 14 days, permanent/NYSC 45 — with a
**60-day hard cap regardless of type**, enforced in both `firestore.rules` (`jobShapeValid()` +
an explicit `expiresAt <= request.time + duration.value(60, 'd')` bound on create) and
`jobPostInputSchema`'s Zod `.refine()`, so an out-of-range date is rejected by the form before a
write is even attempted. `postedBy`, `expiresAt` and `createdAt` are **immutable on update** —
an owner can correct their listing's content and flip `status` to `"filled"`, but cannot extend
its life or reassign it to someone else. **Reposting, not editing, is the only way to extend a
listing** — a fresh 60-day cap, and an honest signal that a role is still genuinely open, not a
listing quietly kept alive past what compulsory expiry was meant to enforce.

List order is newest-first (`createdAt` descending) — urgency is communicated by an
`--harmattan`-highlighted "expires in N days" badge on each row (`design.md` §2: one of exactly
two sanctioned uses of that colour), not by burying a fresh post under one that merely expires
sooner.

**This is the first member-generated, unmoderated content in the app** — every other collection
is exec-authored (`news`, `events`) or strictly self-scoped (`cpdEntries`, `registrations`).
Moderation here is **delete-only, not update**: `firestore.rules` lets `isExec()` delete any
listing (something that shouldn't be on a chapter platform gets removed, not silently rewritten)
but grants no exec update path at all — an exec correcting a member's own post would be a
different, larger design problem than this slice takes on.

A scheduled Cloud Function (`functions/src/jobs.ts`'s `cleanupExpiredJobs`, daily at 03:00
Africa/Lagos) deletes listings expired more than 30 days — NDPA data-minimisation for
`contactVia`, a phone number with no reason to be retained once a listing is no longer even
recently relevant (`docs/08-NDPA-COMPLIANCE.md`). The 30-day grace window is separate from and
longer than the moment a listing actually stops being shown: `lib/data/jobs.ts`'s query reads
`status == 'active'` only and filters out anything already past `expiresAt` client-side, so a
listing disappears from the board the instant it lapses, well before the Function ever deletes
its document.

### `welfareCases/{id}` (Phase 2 — restricted)
Readable only by `role: exec`. Minimum viable fields. No diagnoses, no clinical detail, no
family medical information. If in doubt, leave it out and handle it offline.

### `broadcasts/{id}`
`message, audience, sentBy, sentAt, channel` — a log of what was sent, so the exec has a record.

## Rules invariants (test these, don't assume them)
1. No client can write `status`, `role`, `duesPaidThrough`, `payments/*`, `duesRates/*` — including
   an admin's own client session. (`members/{uid}`'s `update` rule had a gap here until the
   `/admin/members` slice: the `isAdmin()` branch had no trust-field restriction at all, so an
   admin could write `status`/`role` directly without going through a Function — silently
   desyncing the Firestore field from the actual custom claim. Fixed; see the two "admin cannot
   write ... via direct client update" tests.)
2. `directoryEntries` is readable only when the requester's token has `verified == true`.
3. `members/{uid}` is readable by `uid` or admin. Never by another member.
4. `welfareCases` readable only with `role in ["exec","admin"]`.
5. A member cannot set their own `folioNumber` after verification (prevents identity swap).
6. Storage: certificate and receipt paths are namespaced by uid and readable only by that uid
   plus admin. Do not rely on unguessable URLs.
7. `cpdEntries` requires `verified()`, not just `isSelf(uid)` — an authenticated-but-unverified
   account cannot create, read, or delete another self-supposedly-owned entry. `source` can only
   ever be written as `"self_reported"` by a client, and is immutable once set — an entry cannot
   be created honestly and relabelled `"chapter_event"` afterward.
8. A `cpdEntries` doc with `source == "chapter_event"` cannot be updated or deleted by a
   client at all, not even by its own owner — only `markAttendance`/`unmarkAttendance` (Admin
   SDK) touch it. Without this, a member could edit an exec-confirmed attendance entry's
   `creditUnits` or `dateAttended` after the fact, which defeats the reason `chapter_event` is a
   separate label from `self_reported` in the first place.
9. `registrations`' attendance fields (`attended`, `attendanceMarkedBy/At`,
   `attendanceUnmarkedBy/At`, `cpdEntryId`) are Function-only — `allow update: if false`
   entirely, not merely a trust-field carve-out on an otherwise-open update rule. A raw client
   update that set `attended: true` without going through `markAttendance` would leave
   attendance recorded with no linked CPD entry ever created — an inconsistent state, not just a
   bypassed check.
10. `events.cpdCreditUnits` is bounded `0 < n <= 100` in firestore.rules, not only in Zod — the
    same reasoning as `cpdEntries.creditUnits`'s own bound.
11. `jobs.postedBy`, `expiresAt` and `createdAt` are immutable on update — an owner can correct
    content and mark a listing filled, but cannot extend its life, backdate it up a newest-first
    list, or reassign it to someone else. `expiresAt` is bounded both `> request.time` and
    `<= request.time + 60 days` at create, regardless of type. Moderation (`isExec()`) is
    delete-only — there is no exec update path on this collection at all.

## Indexes
Composite indexes needed for: news by `status + publishedAt desc`, events by
`status + startAt asc`, jobs by `status + createdAt desc` (not `status + expiresAt` — the jobs
list orders newest-first, not soonest-expiring; `expiresAt` filtering happens client-side per
row instead, since Firestore requires a range filter's field to be the first `orderBy`, and that
would have forced sorting by expiry). **Not** directory — `/portal/directory` deliberately does one unfiltered `orderBy`
subscription and filters client-side (see `lib/data/directory.ts`), so no composite query, no
composite index. (An earlier version of this doc listed two `directoryEntries` indexes for a
server-filtered query pattern that was never built, referencing a `specialty` field that was
never the real field name — `department` is. Removed from `firestore.indexes.json` rather than
fixed, since nothing needs them.) Add new ones here as they're created, never by clicking the
console link in production only.
