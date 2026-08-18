# 01 — Product requirements

## The problem, stated precisely
A state-chapter website has no natural traffic. Members already belong; they don't need to be
sold the association. So the site must supply something the member cannot get more easily
somewhere else — specifically, more easily than by scrolling the chapter WhatsApp group.

That is the whole test. Every feature gets scored on it.

## Who uses this
| Persona | What they need | Frequency |
|---|---|---|
| **Consultant** | A verified colleague to refer a patient to, today. CPD evidence at renewal. | Weekly |
| **Resident / NARD member** | Locum and job leads. CME events. Welfare info during disputes. | Weekly |
| **Chapter Treasurer** | Dues collected without chasing people, and a reconcilable ledger. | Monthly |
| **Chapter Secretary** | To publish a communiqué in under five minutes from a phone. | Weekly-ish |
| **Public / patient** | Is this doctor real? Where do I find a specialist? | Rare, but high-trust |

## The anchor feature — and a revision worth noting
Earlier reasoning made the MDCN licence-renewal countdown the anchor. That's now out (MDCN has
its own portal; see ADR-003). Removing it changes the answer, so the ranking was redone on
**frequency of genuine need**:

1. **Verified member directory with one-tap WhatsApp/call** — a Gombe doctor needs a colleague
   in another specialty regularly. Today they shout into a WhatsApp group and hope someone who
   knows answers. A structured, searchable, always-current, verified directory beats that
   decisively — and it works offline from cache. **This is the anchor.**
2. **Dues payment + instant receipt + digital folio card** — annual, but it funds the chapter
   and is the reason a member completes verification. It is the *business* anchor.
3. **CPD/CME credit log with exportable summary** — several times a year, and urgent at renewal
   season. MDCN requires CPD evidence; nobody currently holds a doctor's own record for them.
   High stickiness, low competition. Ships in Phase 2.
4. **Jobs and locum board** — weekly for younger members, near-zero for consultants.
5. **News, communiqués, advocacy** — episodic. Real value only during industrial action, when
   WhatsApp already carries it. Treat as archive-of-record, not a traffic driver.

**MVP = 1 + 2.** Directory gives the reason to come; dues gives the reason to verify; the folio
card is the artefact that makes verification feel worth it.

## In scope, Phase 1
- Account signup (phone or email), folio-number submission, admin verification queue.
- Verified member directory: search by specialty, facility, name. Per-field visibility opt-ins.
  One-tap WhatsApp and call. Cached for offline.
- Digital membership card: name, folio number, grade, dues year, QR code that resolves to a
  public verification page. Downloadable as an image; visible offline.
- Dues payment via Paystack; server-computed amount; instant on-screen and emailed receipt;
  ledger export for the Treasurer.
- Public pages: home, about, exec, news/communiqués, events, contact, privacy policy.
- Admin: verification queue, post news/event, payment ledger, member management.
- PWA: installable, offline shell, offline card and directory.

## Explicitly out of scope
- **MDCN licence payment or renewal of any kind.** (ADR-003)
- In-app chat, forum, or message board. WhatsApp exists and has won. (ADR-004)
- Email newsletter platform. (Use WhatsApp broadcast; email is receipts only.)
- E-voting and AGM systems — Phase 3 at the earliest, and only with a written exec mandate,
  because a disputed election result blamed on the website will end the project.
- A public patient-facing symptom checker or any clinical advice tool. Liability, no upside.
- Native mobile app in Phase 1. Same Firebase backend makes it cheap later; do it after the
  web portal has traction.

## Non-functional requirements
- ≤ 200KB gzipped JS per route; ≤ 350KB first-load total transfer.
- Largest Contentful Paint ≤ 2.5s on throttled Slow 4G, mid-range Android.
- Usable on a 320px-wide screen.
- WCAG 2.2 AA.
- Directory and card readable with no network.
- Zero personal data in third-party analytics.

## How we know it worked (90 days)
- **Primary:** ≥ 30% of the roster has a verified account. (< 30% = failure.)
- Secondary: ≥ 40% of dues collected online in the first full dues cycle; median ≥ 2 directory
  lookups per verified member per month; Secretary publishes ≥ 2 items per month unprompted.
- Leading indicator of failure: verification queue untouched for 7 days.
