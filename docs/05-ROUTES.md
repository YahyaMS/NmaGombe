# 05 — Sitemap and routes

Server-rendered unless marked. `(client)` means the route is interactive and gated.

## Public
```
/                        Home. Public: what the chapter is, latest communiqué, upcoming CME,
                         find-a-doctor entry point. Logged in: the folio card and dues status
                         replace the hero. Same URL, different job.
/about                   Chapter, history, constitution/bye-laws.
/about/executives        Current exec with portraits and tenure. Past execs as an archive.
/news                    Communiqués, news, advocacy, obituaries. Filterable by category.
/news/[slug]
/events                  CME and chapter events calendar.
/events/[slug]           Detail + register (register is gated).
/doctors                 Public find-a-doctor. Name, specialty, facility ONLY. No contacts.
/verify/[folio]          QR target from the membership card. Renders: name, grade, "member in
                         good standing through <year>" or "not current". Nothing else.
                         This page is the chapter's credibility in public. Keep it austere.
/membership              How to join, dues structure, benefits. The conversion page.
/contact                 Includes a click-to-WhatsApp link to the secretariat.
/privacy                 NDPA privacy notice.
/terms
```

## Auth
```
/signin                  Phone OTP primary, email fallback.
/signup                  Account creation → folio submission → "pending review" state.
/pending                 Honest waiting-room. Says who reviews it and roughly how long.
                         A vague pending screen is where signups die.
```

## Member (requires `verified: true`)
```
/portal                          (client) Dashboard: folio card, dues status, MDCN renewal
                                 reminder (date only, deep-links to the MDCN portal), next event.
/portal/card                     (client) Full-screen folio card. Works offline. Downloadable.
/portal/dues                     (client) Pay, history, receipts.
/portal/dues/receipt/[ref]       Receipt view/download.
/portal/directory                (client) Search colleagues. One-tap WhatsApp/call. Offline cache.
/portal/directory/[uid]          Member detail, subject to that member's visibility flags.
/portal/profile                  Edit own details, set per-field visibility, set MDCN renewal month.
/portal/cpd                      (Phase 2) CPD log, add entry, upload certificate, export summary.
/portal/jobs                     (Phase 2) Locum and job board.
/portal/jobs/new                 (Phase 2) Post a listing. Expiry required.
/portal/documents                Member-only downloads: guidelines, forms, circulars.
/portal/welfare                  (Phase 2) Welfare fund info + how to open a case (form only,
                                 not a case viewer).
```

## Admin (`role: admin` or `exec`)
```
/admin                           Queue counts, dues collected this cycle, recent signups.
/admin/verification              THE most important admin screen. Approve/reject folio
                                 submissions against the roster. Keyboard-driven, fast,
                                 usable on a phone. If this is slow, signups rot.
/admin/members                   Search, edit, suspend, grant roles.
/admin/payments                  Ledger, reconciliation, CSV export for the Treasurer.
/admin/news/new  /admin/news     Three fields and a publish button. Nothing more.
/admin/events/new  /admin/events
/admin/broadcast                 Compose a WhatsApp broadcast message; logs what was sent.
/admin/duesRates                 Set the year's rates by grade.
/admin/welfare                   (exec only) Welfare cases.
```

## Route-level rules
- Everything under `/portal` and `/admin` is `noindex`, guarded in middleware **and** re-checked
  server-side. Middleware alone is not authorisation.
- `/verify/[folio]` is public, indexable, cached at the edge, and deliberately reveals nothing
  beyond membership standing.
- `/doctors` is public but contains no contact details. Contact details live behind verification.
  If this line is ever crossed, the directory becomes a scraper's product.
