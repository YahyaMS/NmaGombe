# 00 — Intake: what must exist before a line of code

This is the honest list. Items marked **BLOCKER** stop the build; the rest slow it down.
Nothing here is a technical problem — which is exactly why projects like this die.

## A. Mandate and politics
1. **BLOCKER — Written mandate.** Which chapter officer authorised this, and is it minuted?
   A website that touches dues and member data without exec sign-off gets shut down at the
   first AGM.
2. **BLOCKER — Does the Treasurer want online dues?** Online payment changes who sees the
   money and when. If the Treasurer isn't a co-owner of this feature, it will be quietly
   killed after launch. Get their yes before designing it.
3. Who is the named content owner (usually Secretary or Publicity Secretary), and how many
   minutes per week will they realistically spend? Answer honestly — the whole content plan
   is sized off this number.
4. What happens at the next exec handover? Who holds credentials then?

## B. Money and payments
5. ~~**BLOCKER — Paystack (or Monnify) merchant account.** Nigerian gateways require a
   registered business/organisation and supporting documents; a state chapter may need a CAC
   registration or an existing registered entity behind the account. Confirm what the chapter
   can produce *before* promising online dues.~~
   **Confirmed blocked, 2026-08-27.** The Gombe chapter has no CAC (Corporate Affairs
   Commission) registration — only the parent national association does, and it collects
   national dues separately under that registration. This isn't a "resolve before launch"
   blocker any more; it's an indefinite one with no clear path, not tied to this project's
   timeline at all. Dues payment is deferred to a much later, unscheduled phase
   (`docs/06-ROADMAP.md`'s Version 3, `docs/09-DECISIONS.md` ADR-021) rather than treated as
   pending. Do not build toward it, and do not word anything as "coming soon."
6. Settlement bank account, and who reconciles it monthly.
7. **Partially cleared, 2026-08-28.** Amount: ₦12,000 per member per month, flat across all
   grades (shown on `/membership`, informational text only — no payment flow, that's still
   blocked on item 5). Still open: the portion remitted to national, and how arrears are
   treated. A flat monthly rate this high is worth double-checking wasn't meant as an annual
   figure before it's repeated anywhere else — confirm rather than assume either way.
8. Is part-payment allowed? Are there waivers (retired, students, hardship)?

## C. Member data — the verification source of truth
9. ~~**BLOCKER — the current membership roster.** Names, MDCN folio numbers, grade, facility,
   phone. Whatever format exists (Excel, a Word doc, a notebook). Without a roster there is
   nothing to verify signups against, and the directory has no seed.~~
    **Cleared.** In hand at `data/roster-2025-2026.xlsx` (gitignored, never committed — NDPA).
    Per `09-DECISIONS.md` ADR-014 it's a dues-eligibility ledger only (names and payment
    status, no department/facility/folio), so it seeds verification-by-name-match, not an
    automated folio cross-check — see item 11. A second, larger name list (~300 entries, no
    folio/facility/grade, visibly unstructured — duplicates, inconsistent formatting) was
    supplied 2026-08-28 and saved the same way, `data/roster-doctors-list-2026.csv`
    (gitignored). **Not published anywhere on the site** — no consent basis to list these
    people publicly or in the member directory (see ADR-024). Confirmed 2026-08-29 as the
    association's own register; built into `/admin/verification` as a fuzzy name-matching hint
    (`registerEntries/{id}`, Admin-SDK-only, `scripts/import-register.ts`) — still never
    surfaced to members or the public, per ADR-024's update.
10. Who custodies that roster today, and do we have written permission to hold a copy?
11. ~~Agreed rule for what makes someone "verified": folio number matches roster? Officer
    vouches? Dues current? Pick one and write it down.~~
    **Cleared** — see ADR-010. An admin approves by matching the submitted name against the
    roster plus their own knowledge of the membership; no automated folio cross-check exists.
12. ~~**Governance decision:** is the directory public or member-only? Are phone numbers
    visible to all members, or opt-in per member? Recommended default: directory is
    member-only; phone/WhatsApp is opt-in per field; the public site shows only name,
    specialty and facility.~~
    **Cleared** — built exactly to the recommended default.

## D. Brand and content assets
13. Vector chapter/NMA crest (SVG, EPS, or high-res PNG with transparency). A screenshot of
    the logo taken off thenma.ng is not acceptable for print-quality cards.
    **Partially cleared** — `public/brand/crest.svg` is genuine vector-traced artwork, fine
    for screen use (see `public/brand/README.md`). Still not the official source file; get
    that from the national secretariat before anything goes to print (cards, certificates).
14. Official colour values if any exist beyond the inherited green. If none exist, we set
    them — see `04-DESIGN-SYSTEM.md`.
15. 15–30 real photographs: exec members, a CME session, outreach, the secretariat. Real
    Gombe photos or nothing — stock photos of foreign doctors will destroy credibility faster
    than a plain page would.
    **In progress** — 11 real photos in `public/photos/` (exec portraits, group photos), no
    stock. Below the 15–30 target; keep collecting.
16. ~~Current exec list: names, positions, portraits, tenure dates.~~
    **Cleared** — real names, positions and portraits live in `/executives` (split out from
    `/about` 2026-08-29, its own page with past leadership, per the user's request).
17. ~~Chapter history/about text; constitution or bye-laws if members should access them.~~
    **Partially cleared, 2026-08-28.** History text supplied (written by Dr. Ishaq Inuwa
    Gombe, Chairman) and live on `/about`, lightly copy-edited for grammar. Constitution/
    bye-laws still not supplied.
18. Any existing communiqués, newsletters or press statements to seed the archive.

## E. Infrastructure ownership
19. ~~**Domain**, registered to a chapter-owned account, not a personal one. `.org.ng`
    preferred. Who pays for renewal, from which budget line?~~
    **Partially cleared.** `nmagombe.org` purchased and connected via Vercel (2026-08-27),
    live in production — `.org`, not the originally-preferred `.org.ng` (worth confirming
    that's the deliberate final choice, not a placeholder). Still open: confirm the
    registering account is chapter-owned, not a developer's personal one, and which budget
    line covers the $10.99/year renewal — same handover concern as item 4.
20. A chapter-controlled email address (e.g. `secretariat@…`) to own the Firebase project,
    registrar account, Paystack account and GitHub org. **Never a personal Gmail.**
    `nmagombestate@gmail.com` is now published on `/contact` as the secretariat's contact
    address — a shared chapter Gmail, better than a personal one, but still not what this item
    asks for. Worth moving to `secretariat@nmagombe.org` now that the domain exists, and
    confirming who actually holds the Gmail account's credentials in the meantime.
21. A password manager the exec can hand over. This is the difference between a site that
    survives one exec cycle and one that doesn't.
22. WhatsApp: which groups exist, roughly how many members in each, who admins them. That is
    the launch distribution channel — the site has no other one.

## F. Legal
23. Decision on NDPC registration, and who signs the privacy policy.
24. Sensitivity ruling on welfare/benevolent-fund data. Recommendation: welfare case details
    visible only to the Welfare Committee, never in the general member area.
25. ~~Consent language for the directory, agreed at an exec meeting — not written by the developer.~~
    **Cleared.** `/doctors` is built on this basis.

## G. Success definition — agree this in writing, in advance
26. One number, measured at 90 days. Recommended: **% of the roster with a verified account.**
    Below 30% and the project has failed regardless of how good the code is. Page views and
    "engagement" are vanity metrics here.

## H. Developer prerequisites (fast, do these last)
- Node LTS installed; a GitHub repo under a chapter-owned org.
- ~~Two Firebase projects: `nma-gombe-dev`, `nma-gombe-prod`.~~
  **Superseded.** One project, `nma-gombe-c5a9d` — the two-project split was deliberately
  rejected; see `docs/09-DECISIONS.md` ADR-009. Local development uses that project's
  emulators, not a second live project.
- ~~Paystack **test** keys (live keys only after item 5 clears).~~
  **Moot.** Item 5 is confirmed indefinitely blocked, not "not yet cleared" — there are no
  Paystack keys to provision, test or live, until that changes. See ADR-021.
- Vercel or Firebase Hosting account under the chapter email.
- The roster, de-identified, as a CSV fixture for local development.
