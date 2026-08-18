# 07 — Content operations (the anti-decay plan)

A website's design fails slowly. Its content fails in about ten weeks. Plan for the second one.

## The design rule that saves you
**Every module must look correct when it is empty.** No "Latest news" box rendering a blank
panel, no "Upcoming events" widget printing "No event found!", no counter showing zero. If
there's no upcoming event, that module is not rendered at all. The parent site's homepage is a
live demonstration of what happens when you skip this.

Corollary: nothing on the homepage should be dated unless it self-expires.

## Owners
| Content | Owner | Cadence | Where |
|---|---|---|---|
| Verification queue | Secretary + one deputy | within 48h, tracked | `/admin/verification` |
| Communiqués, news | Publicity Secretary | as they occur | `/admin/news/new` |
| Events / CME | Secretary | as scheduled | `/admin/events/new` |
| WhatsApp broadcast | Publicity Secretary | weekly during active periods | `/admin/broadcast` |
| Dues reconciliation | Treasurer | monthly | `/admin/payments` |
| Dues rates | Treasurer | annually | `/admin/duesRates` |
| Exec list | Secretary | at each handover | `/admin/members` |
| Guidelines / documents | a named clinical lead | quarterly review | `/admin` |
| Welfare cases | Welfare Committee chair | as they occur | `/admin/welfare` |

If a row has no name against it, delete the feature. An unowned feature is a future embarrassment.

## The one thing that must never lapse
The weekly WhatsApp broadcast. It is the only thing that reliably pulls people back. Everything
else can go quiet for a month without damage.

## Handover checklist (run at every exec transition)
1. Vault credentials rotated and transferred; outgoing officers removed.
2. Domain and Firebase billing confirmed against the new budget line.
3. New exec list published; portraits updated.
4. Admin roles regranted; old admin claims revoked the same day.
5. Owners table above reconfirmed with names.
6. One test: post a news item, approve a verification, export the ledger. If the new Secretary
   can't do all three from a phone in ten minutes, the admin UI needs work, not the Secretary.

## Quarterly review, 30 minutes
- Verified accounts as a share of the roster (the number that matters).
- Directory lookups per member.
- Dues collected online vs offline.
- Queue age, median time-to-approval.
- Dead content: expired jobs, past events, stale documents. Delete, don't archive.
