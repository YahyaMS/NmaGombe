# 05 — Sitemap and routes

Server-rendered unless marked. `(client)` means the route is interactive and gated.

## Public
```
/                        Home. Public: what the chapter is, latest communiqué, upcoming CME,
                         find-a-doctor entry point. Logged in: the folio card and dues status
                         replace the hero. Same URL, different job.
/about                   Chapter, history, constitution/bye-laws.
/about/executives        Current exec with portraits and tenure. Past execs as an archive.
/news                    Communiqués, news, advocacy, obituaries. Filterable by ?category=,
                         plain links — no client JS. Reads via Admin SDK (lib/data/news.ts),
                         same pattern as /verify — public page, no reason to ship the client SDK.
/news/[slug]             Renders body through a small hand-written markdown subset (bold, links,
                         lists) — not a dependency; see lib/markdown.tsx.
/events                  CME and chapter events calendar, soonest first. Publishing only —
                         registration is Phase 2 (rules exist for `registrations/*` but nothing
                         reads or writes it yet).
/events/[slug]           Detail: date, location, description. No register action yet.
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
                                 is set — real URL not yet known), next event. Dues status omitted —
                                 still blocked on the Paystack merchant account.
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
/portal/jobs                     (Phase 2) Locum and job board.
/portal/jobs/new                 (Phase 2) Post a listing. Expiry required.
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
                                 Single-step create-and-publish, no draft/edit/unpublish in v1 —
                                 exec-gated (useExecGuard), matching isExec() in firestore.rules.
/admin/events/new  /admin/events Four fields (title, location, date/time, description) and a
                                 publish button. Same single-step, exec-gated pattern as news.
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
