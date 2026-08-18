# 10 — Test plan

Test where a failure is expensive, not everywhere. Three places are expensive here: money,
authorisation, and offline behaviour.

## 1. Firestore security rules — unit tested, non-negotiable
Using `@firebase/rules-unit-testing` against the emulator. Every invariant in `03-DATA-MODEL.md`
gets a test that asserts **denial**, not just success. The failure mode of security rules is a
permissive rule that lets tests pass.

Minimum suite:
- unauthenticated user cannot read `members/*`, `directoryEntries/*`, `payments/*`
- authenticated-but-unverified user cannot read `directoryEntries/*`
- verified member cannot read another member's `members/{uid}` document
- verified member cannot write their own `status`, `role`, or `duesPaidThrough`
- no client identity can write to `payments/*` or `duesRates/*`
- non-exec cannot read `welfareCases/*`
- a member cannot change `folioNumber` once `status == "verified"`
- a member's hidden field is absent from their `directoryEntries` document, not merely masked

## 2. Payments — the only place a bug costs real money
- Webhook with a valid signature → payment recorded, dues year updated, receipt generated.
- Webhook with an **invalid** signature → nothing written, silent 200.
- Webhook replayed with the same reference → exactly one payment document, one receipt.
  (Gateways retry. Test this specifically.)
- Client attempting to set its own amount → server ignores it and uses `duesRates`.
- Payment for a member whose grade changed mid-year → uses the rate at time of payment.
- Reconciliation export totals match the sum of payment documents for the period.

## 3. Offline and slow network — the local reality
Manual, on a real mid-range Android device, throttled:
- Load the portal, enable aeroplane mode: folio card renders, directory searches the cache.
- Cold load on Slow 4G: LCP under 2.5s, no layout shift.
- Payment initiated on a dropping connection: no double charge, clear recovery state.
- Directory search with 500 seeded entries: no visible lag, no runaway read count.
  (Watch the Firestore usage panel while testing — a query that reads 500 documents per
  keystroke is a cost bug, not just a performance bug.)

## 4. Accessibility
Automated axe pass in CI on every public route. Manual keyboard traversal of signup, dues
payment, and directory search. Contrast verified against tokens, not eyeballed.

## 5. What we deliberately do not test
Exhaustive component snapshots, and full end-to-end suites for content pages. They break on
every copy change and catch nothing that matters on a project this size.
