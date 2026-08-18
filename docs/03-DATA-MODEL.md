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
displayName, title, grade ("consultant"|"resident"|"medical_officer"|"house_officer"|"retired")
folioNumber            // submitted by member, confirmed by admin
specialty, subspecialty, facility, town
phone, whatsapp, email
visibility: { phone: bool, whatsapp: bool, email: bool, facility: bool }
status: "pending" | "verified" | "rejected" | "suspended"   // FUNCTION-ONLY
role: "member" | "exec" | "admin"                            // FUNCTION-ONLY
duesPaidThrough: number  // year, e.g. 2026                  // FUNCTION-ONLY
mdcnRenewalMonth: number // 1-12, member-entered, for reminders only. NO fees, NO payment.
createdAt, updatedAt
```
Read: self, and `role: admin`. Never readable in bulk by members — that is what
`directoryEntries` is for.

### `directoryEntries/{uid}`
The only collection members can query. Written **only** by a Function that projects
`members/{uid}` through the member's own visibility flags.
```
displayName, title, grade, specialty, subspecialty, facility, town
phone?, whatsapp?      // present only if that visibility flag is true
verifiedAt
searchTokens: string[] // lowercased name + specialty tokens for prefix search
```
Rationale: one document read per result, no joins, and a member's hidden fields are physically
absent rather than filtered client-side. If it is not in the document, it cannot leak.

### `verificationRequests/{id}`
`uid, folioNumber, evidenceUrl?, submittedAt, decidedBy?, decidedAt?, decision?, note?`
Create: the requesting member. Read/update: admin only. Keep the audit trail — a rejected
doctor will ask why.

### `payments/{paystackReference}`
`uid, amountKobo, year, channel, status, paystackReference, paidAt, receiptUrl`
**No client writes, ever.** Document ID is the Paystack reference, which gives idempotency for
free when webhooks retry. Read: own payments, plus admin.

### `duesRates/{year}`
`{ grade: amountKobo }` — the server's only source of truth for price. Admin-writable, never
client-writable, and the client never sends an amount.

### `cpdEntries/{uid}/entries/{id}` (Phase 2)
`title, provider, creditUnits, dateAttended, certificateUrl, source ("chapter_event"|"self_reported")`
Self-reported entries are labelled as such. We record what the member tells us; we do not
certify it, and the export says so.

### `events/{id}`, `registrations/{eventId}_{uid}`
Registration ID is deterministic to make double-registration impossible.

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
1. No client can write `status`, `role`, `duesPaidThrough`, `payments/*`, `duesRates/*`.
2. `directoryEntries` is readable only when the requester's token has `verified == true`.
3. `members/{uid}` is readable by `uid` or admin. Never by another member.
4. `welfareCases` readable only with `role in ["exec","admin"]`.
5. A member cannot set their own `folioNumber` after verification (prevents identity swap).
6. Storage: certificate and receipt paths are namespaced by uid and readable only by that uid
   plus admin. Do not rely on unguessable URLs.

## Indexes
Composite indexes needed for: directory by `specialty + displayName`, `searchTokens array-contains
+ displayName`, news by `status + publishedAt desc`, jobs by `status + expiresAt`. Add them to
`firestore.indexes.json` as they are created, never by clicking the console link in production only.
