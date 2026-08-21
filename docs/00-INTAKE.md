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
5. **BLOCKER — Paystack (or Monnify) merchant account.** Nigerian gateways require a
   registered business/organisation and supporting documents; a state chapter may need a CAC
   registration or an existing registered entity behind the account. Confirm what the chapter
   can produce *before* promising online dues. This is the most common place this project stalls.
6. Settlement bank account, and who reconciles it monthly.
7. Full dues structure: amount by member grade/category, the portion remitted to national,
   and how arrears are treated. Actual figures, not "roughly."
8. Is part-payment allowed? Are there waivers (retired, students, hardship)?

## C. Member data — the verification source of truth
9. ~~**BLOCKER — the current membership roster.** Names, MDCN folio numbers, grade, facility,
   phone. Whatever format exists (Excel, a Word doc, a notebook). Without a roster there is
   nothing to verify signups against, and the directory has no seed.~~
    **Cleared.** In hand at `data/roster-2025-2026.xlsx` (gitignored, never committed — NDPA).
    Per `09-DECISIONS.md` ADR-014 it's a dues-eligibility ledger only (names and payment
    status, no department/facility/folio), so it seeds verification-by-name-match, not an
    automated folio cross-check — see item 11.
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
    **Cleared** — real names, positions and portraits live in `/about` and `/about/executives`.
17. Chapter history/about text; constitution or bye-laws if members should access them.
18. Any existing communiqués, newsletters or press statements to seed the archive.

## E. Infrastructure ownership
19. **Domain**, registered to a chapter-owned account, not a personal one. `.org.ng`
    preferred. Who pays for renewal, from which budget line?
20. A chapter-controlled email address (e.g. `secretariat@…`) to own the Firebase project,
    registrar account, Paystack account and GitHub org. **Never a personal Gmail.**
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
- Two Firebase projects: `nma-gombe-dev`, `nma-gombe-prod`.
- Paystack **test** keys (live keys only after item 5 clears).
- Vercel or Firebase Hosting account under the chapter email.
- The roster, de-identified, as a CSV fixture for local development.
