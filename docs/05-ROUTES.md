# 05 — Sitemap and routes

Server-rendered unless marked. `(client)` means the route is interactive and gated.

## Public
```
/                        Home. Signed out: what the chapter is, find-a-doctor entry point, a
                         demo folio card with "Get verified →", and the single latest
                         communiqué (absent entirely if none is published). Signed in as a
                         verified member/admin: the folio-card section shows the visitor's
                         own real card (GET /api/portal/own-card, session-cookie authenticated,
                         own record only) with "Go to your portal →" in place of the demo card
                         and CTA — falls back to the demo card silently on any fetch failure.
                         Pending: no card, a short "under review" note. Same URL, different job.
                         No dues status shown anywhere here — still blocked on the Paystack
                         merchant account, same as /portal.
/about                   Chapter, history, constitution/bye-laws.
/about/executives        Current exec with portraits and tenure. Past execs as an archive.
/news                    Communiqués, news, advocacy, obituaries. Filterable by ?category=,
                         plain links — no client JS. Reads via Admin SDK (lib/data/news.ts),
                         same pattern as /verify — public page, no reason to ship the client SDK.
/news/[slug]             Renders body through a small hand-written markdown subset (bold, links,
                         lists) — not a dependency; see lib/markdown.tsx.
/events                  CME and chapter events calendar, soonest first.
/events/[slug]           Detail: date, location, description. No register action here — stays
                         Firebase-SDK-free. Registration lives on /portal (the offline-tier
                         route), keyed to the same event by slug.
/doctors                 Public find-a-doctor. Name, specialty, facility ONLY. No contacts.
/verify/[folio]          QR target from the membership card. Renders: name, grade, "member in
                         good standing through <year>" or "not current". Nothing else.
                         This page is the chapter's credibility in public. Keep it austere.
                         Its opengraph-image renders that member's actual folio card (or the
                         same "No record found" text as the page, for an unmatched folio) so a
                         shared link previews as the credential, not the site-wide default image.
/membership              How to join, dues structure, benefits. The conversion page.
/contact                 Includes a click-to-WhatsApp link to the secretariat.
/privacy                 NDPA privacy notice.
/terms
```

## Auth
```
/signin                  Email-link (passwordless) sign-in — see ADR-010. Phone OTP is deferred,
                         not built.
/signup                  Account creation → folio submission → "pending review" state.
/pending                 Honest waiting-room. Says who reviews it and roughly how long.
                         A vague pending screen is where signups die.
```

## Member (requires `verified: true`)
```
/portal                          (client) Dashboard: folio card, MDCN renewal reminder (date
                                 only, deep-links to the MDCN portal once NEXT_PUBLIC_MDCN_PORTAL_URL
                                 is set — real URL not yet known), next event with a Register
                                 control in the same row (plain setDoc to `registrations/{eventId}_{uid}`
                                 under rules, no Function — the write itself never needs offline
                                 queueing). Dues status omitted — still blocked on the Paystack
                                 merchant account.
/portal/card                     (client) Full-screen folio card. Works offline. Downloadable —
                                 GET /portal/card/download server-renders a PNG from the member's
                                 own record (Authorization: Bearer <ID token>, re-checked there,
                                 not just gated by this page). Requires network even though the
                                 card itself renders from cache.
/portal/dues                     (client) Pay, history, receipts.
/portal/dues/receipt/[ref]       Receipt view/download.
/portal/directory                (client) Search colleagues by name/specialty/facility — one bulk
                                 subscription to directoryEntries, filtered locally against
                                 searchTokens, not a query per keystroke (proven, not just
                                 argued — see PR notes). Shows the full roster by default;
                                 browsing beats searching at chapter scale. Specialty filter —
                                 bottom sheet on mobile (components/ui/BottomSheet.tsx), inline
                                 pill row on desktop, options derived from whatever departments
                                 actually exist in the roster. One-tap WhatsApp/call (phone-based;
                                 see PR discussion on WhatsApp usernames — not adopted, Nigeria
                                 isn't in that rollout yet). Offline cache via Firestore's
                                 persistent local cache (lib/firebase/client.ts).
/portal/directory/[uid]          Member detail, subject to that member's visibility flags. Same
                                 directoryEntries doc, one field.
/portal/profile                  Edit own details, set per-field visibility, set MDCN renewal month.
/portal/cpd                      CPD log: add self-reported entries, attach a certificate after
                                 the fact (offline-friendly — entry creation doesn't wait on an
                                 upload), export a print-optimised summary carrying its own
                                 provenance (name, folio number, generation date, total credit
                                 units) since a printed page leaves the system. No admin
                                 cross-member view — see docs/03-DATA-MODEL.md.
/portal/jobs                     (client) Locum and job board. Newest-first; each row shows a
                                 mono "expires in N days" badge, highlighted with --harmattan
                                 inside its last 3 days — urgency comes from that badge, not
                                 from the sort order. One-tap WhatsApp/call via the same
                                 lib/whatsapp.ts helper the directory uses. Owner can edit
                                 content, mark filled, or delete their own; exec/admin can
                                 delete any listing (moderation is delete-only, no exec edit
                                 path) — the first member-generated, unmoderated content in the
                                 app.
/portal/jobs/new                 (client) Post a listing. Expiry is compulsory and capped at 60
                                 days regardless of type (locum defaults to 14, permanent/NYSC
                                 to 45) — extending a listing means reposting, not editing, since
                                 expiresAt is frozen once created. Contact number prefills from
                                 the member's own profile phone, editable.
/portal/documents                Member-only downloads: guidelines, forms, circulars.
/portal/welfare                  (Phase 2) Welfare fund info + how to open a case (form only,
                                 not a case viewer).
```

## Admin (`role: admin` or `exec`)
```
/admin                           Pending verification count, recent signups. Dues-collected
                                 figure omitted — still blocked on the Paystack merchant account.
/admin/verification              THE most important admin screen. Approve/reject folio
                                 submissions against the roster. Keyboard-driven, fast,
                                 usable on a phone. If this is slow, signups rot.
/admin/members                   Search, suspend/reinstate, grant roles (exec or admin; only an
                                 admin can grant admin). Free-form field editing (fixing a typo'd
                                 facility name etc.) isn't built — members self-serve that at
                                 /portal/profile, and this route is scoped to trust-field changes.
/admin/payments                  Ledger, reconciliation, CSV export for the Treasurer.
/admin/news/new  /admin/news     Three fields (title, category, body) and a publish button.
                                 Single-step create-and-publish — still no draft or unpublish
                                 step, but /admin/news/[slug]/edit lets an exec correct an
                                 already-published item afterward.
/admin/news/[slug]/edit          Same form as /admin/news/new, prefilled — corrects title,
                                 category or body in place. Doesn't notify anyone who already
                                 read it; see docs/07-CONTENT-OPS.md for when a correction needs
                                 a broadcast too.
/admin/events/new  /admin/events Five fields (title, location, date/time, description, optional
                                 CPD credit units) and a publish button. Same single-step,
                                 exec-gated pattern as news. The events list links each row to
                                 both its attendance route and its edit route.
/admin/events/[slug]/edit        Same form as /admin/events/new, prefilled — corrects any field
                                 in place, including cpdCreditUnits. A correction only affects
                                 members marked attended after the edit; it never rewrites credit
                                 already recorded. Doesn't notify registrants; see
                                 docs/07-CONTENT-OPS.md.
/admin/events/[slug]/attendance  Mark/unmark attendance per registrant (httpsCallable
                                 markAttendance/unmarkAttendance — admin-callable tier, same
                                 shape as /admin/verification). Marking writes a CPD entry
                                 (`source: "chapter_event"`) transactionally with the attendance
                                 flag, keyed to a deterministic doc id so it can never double-
                                 credit. Unmarking never deletes that entry — it marks it
                                 withdrawn (a member may have already printed it for MDCN) and
                                 leaves an audit trail on the registration
                                 (attendanceMarkedBy/At, attendanceUnmarkedBy/At).
/admin/broadcast                 Compose a WhatsApp broadcast message; logs what was sent.
/admin/duesRates                 Set the year's rates by grade.
/admin/welfare                   (exec only) Welfare cases.
```

## Route-level rules
- Everything under `/portal` and `/admin` is `noindex`, guarded in middleware **and** re-checked
  server-side. Middleware alone is not authorisation. Implemented as: `src/proxy.ts` (Next.js 16
  renamed `middleware.ts` to `proxy.ts` — same capability, defaults to the Node.js runtime as of
  16.0.0) does the fast first-pass check against the `__session` cookie, no revocation lookup;
  `src/app/portal/layout.tsx` and `src/app/admin/layout.tsx` do the authoritative re-check
  (`checkRevoked: true`) server-side, via `src/lib/auth/session.ts`. Both read only `__session`
  (HttpOnly) — never `nma_display`, the separate display-only cookie the header reads.
- `/verify/[folio]` is public, indexable, cached at the edge, and deliberately reveals nothing
  beyond membership standing.
- `/doctors` is public but contains no contact details. Contact details live behind verification.
  If this line is ever crossed, the directory becomes a scraper's product.
