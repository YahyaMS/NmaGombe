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
                    // and it's immutable after create (firestore.rules). "chapter_event" is
                    // reserved for a future event-attendance Function write once Phase 2's
                    // registrations/{eventId}_{uid} attendance-linking is built — not built yet.
createdAt
```
No client access beyond self: `allow get, list, create, update, delete: if isSelf(uid) && verified()`.
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
`title, slug, description (markdown), location, startAt, status ("draft"|"published")`
Publishing only — single-step create-and-publish, no draft/edit/unpublish in v1, same as `news`.
Public list orders by `startAt` ascending (a calendar shows soonest-next, not most-recently
posted); past events are removed by the admin, not auto-hidden (`docs/07-CONTENT-OPS.md`
quarterly review — "delete, don't archive").

### `registrations/{eventId}_{uid}` (Phase 2 — not built)
Registration ID is deterministic to make double-registration impossible. `firestore.rules`
already has a match block for this (verified members can create their own registration; exec
manages), written ahead of the UI/Function — nothing reads or writes it yet.

### `news/{slug}`
`title, slug, body (markdown), excerpt, coverUrl, publishedAt, author, category ("communique"|"news"|"advocacy"|"obituary"), status ("draft"|"published")`

### `jobs/{id}` (Phase 2)
`title, facility, town, type ("locum"|"permanent"|"nysc"), description, contactVia, postedBy, expiresAt, status`
**Every job expires.** A board full of dead listings is worse than no board.

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

## Indexes
Composite indexes needed for: news by `status + publishedAt desc`, events by
`status + startAt asc`, jobs by `status + expiresAt` (Phase 2). **Not** directory — `/portal/directory` deliberately does one unfiltered `orderBy`
subscription and filters client-side (see `lib/data/directory.ts`), so no composite query, no
composite index. (An earlier version of this doc listed two `directoryEntries` indexes for a
server-filtered query pattern that was never built, referencing a `specialty` field that was
never the real field name — `department` is. Removed from `firestore.indexes.json` rather than
fixed, since nothing needs them.) Add new ones here as they're created, never by clicking the
console link in production only.
