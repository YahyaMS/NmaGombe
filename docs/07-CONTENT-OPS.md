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

## A correction is not automatically seen
`/admin/events/[slug]/edit` and `/admin/news/[slug]/edit` fix a mistake in place — a typo, a
wrong date, a wrong CPD credit figure. They do not notify anyone. A member who already read the
communiqué yesterday, or already registered for the event, sees nothing change; the correction
only reaches whoever loads the page again. That's fine for a typo. **For anything material — a
changed date, a changed venue, a changed CPD figure — send a WhatsApp broadcast too
(`/admin/broadcast`), not just the edit.** The edit fixes the record; the broadcast is what
actually reaches a member who has already moved on with the wrong information. This is a process
rule for whoever is editing, not something the software enforces.

## If someone says "the site hasn't changed in days"
Believe them before you doubt the deploy. `docs/09-DECISIONS.md` ADR-018 records a real incident
where a service-worker caching bug meant a returning visitor's browser silently kept serving a
build from days earlier — every deploy since then succeeded, and the site still looked frozen for
anyone who'd already loaded it once. That specific bug is fixed, but the fix only takes effect for
someone once their browser picks up the new worker, which needs one online visit. **If someone —
especially an exec who was shown the site before this landed — is still seeing anything stale,
give them this:**
1. Reload the page once while online. This alone is usually enough now that HTML is fetched
   fresh on every navigation rather than served from cache.
2. If that doesn't clear it: on the phone or computer in question, open the browser's site
   settings for the page (or DevTools → Application → Service Workers on desktop) and choose
   "Unregister" / "Clear site data," then reload.
3. As a last resort, a fully hard reload (clear browsing data for the site, or open the URL in a
   fresh private/incognito window) always works — that's how this was confirmed and diagnosed in
   the first place.
**If you demoed the site to the executives from a device that had it open before this fix
shipped, assume they saw a stale version and may still be seeing one** — this is worth a direct
follow-up message, not waiting for someone to notice and report it again.

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
