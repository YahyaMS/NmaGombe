# NMA Gombe State Chapter — website & member portal

A member portal that a Gombe doctor has an actual reason to open: a verified colleague
directory with one-tap WhatsApp, online dues with an instant receipt and digital folio card,
and a CPD credit log they can export at licence-renewal time.

## Start here
| Doc | What it answers |
|---|---|
| `docs/00-INTAKE.md` | What must be collected from the chapter before writing code |
| `docs/01-PRD.md` | What we are building, for whom, and what we are deliberately not building |
| `docs/02-ARCHITECTURE.md` | Stack, hosting, costs, rejected alternatives |
| `docs/03-DATA-MODEL.md` | Firestore collections, claims, security posture |
| `docs/04-DESIGN-SYSTEM.md` | Palette, type, tokens, the signature element |
| `docs/05-ROUTES.md` | Sitemap: public / member / admin |
| `docs/06-ROADMAP.md` | Phases, acceptance criteria, what ships first |
| `docs/07-CONTENT-OPS.md` | Who updates what, how often — the anti-decay plan |
| `docs/08-NDPA-COMPLIANCE.md` | Nigerian data-protection obligations |
| `docs/09-DECISIONS.md` | ADR log — read before re-litigating a settled choice |
| `docs/10-TEST-PLAN.md` | What must be tested and how |

## Local setup
```bash
cp .env.example .env.local   # fill in Firebase + Paystack test keys
npm install
npm run dev                  # http://localhost:3000
npm run emulators            # Firebase emulators (auth, firestore, functions)
npm run test:rules           # Firestore security rules unit tests
npm run check:budget         # bundle budget check (after `npm run build`) — see ADR-016
npm run check:routes         # docs/05-ROUTES.md's [Built] tags match real page files
```

## Environments
- `dev` — Firebase project `nma-gombe-dev`, Paystack **test** keys.
- `prod` — Firebase project `nma-gombe-prod`, Paystack live keys. Live keys never leave
  the hosting provider's secret store.

Never point local development at the production Firebase project. Real member data is
regulated under the NDPA.
