# NMA Gombe — project instructions for Claude Code

## What this is
Website + member portal for the Nigerian Medical Association, Gombe State Chapter.
Audience: ~ a few hundred to low thousands of doctors in Gombe State, plus the public.

**The one thing this project exists to fix:** members have no reason to return to a chapter
website. Every feature must answer "why would a busy Gombe doctor open this on a Tuesday?"
If a feature only answers "because the association wants them to," it is not a feature.

Read `docs/01-PRD.md` before proposing any feature. Read `docs/09-DECISIONS.md` before
proposing any architecture change — several obvious ideas were already rejected there for
reasons that are not obvious.

## Non-negotiable constraints
- **Mobile-first, Android, expensive data.** JS payload budget is tiered by what a route
  actually needs — a single number across the whole app was found to be unreachable for any
  route using the Firestore client SDK (measured, not assumed: Auth alone is ~44KB gzipped,
  Firestore alone is ~162KB, and the Next.js/React framework floor every route pays is
  ~144KB — 144 + 44 already exceeds 200KB before Firestore is counted). See
  `docs/09-DECISIONS.md` ADR-016 for the measurements and reasoning behind each tier.
  - **Public and server-rendered authenticated routes: ≤ 200KB gzipped, strict.** Measured
    floor is ~144KB (public) to ~161KB (an SSR page with a small interactive form). This is
    where first impressions and SEO live — hold this line.
  - **Admin routes still calling a Cloud Function via `httpsCallable`** (`/admin/verification`,
    `/admin/members`, `/admin/broadcast` — Auth + Functions, no Firestore): **≤ 250KB gzipped.**
    Measured ~195–210KB. These stay on this path deliberately — see ADR-016 on why the write
    doesn't move to a Route Handler.
  - **Offline-capable member routes** (`/portal`, `/portal/card`, `/portal/directory`,
    `/portal/cpd`, `/portal/profile` — genuinely need the Firestore client SDK): **≤ 400KB
    gzipped**, accepted as the cost of real offline capability. Measured ~365–367KB. Every
    other authenticated route must justify staying in this tier or move to the SSR pattern —
    see ADR-016's per-route reasoning before adding a new one here.
  - Total first-load transfer ≤ 350KB still applies to the public/SSR tier. The offline tier
    is a known, deliberate exception to it, not a target to shrink further without cause.
  - Run `npm run analyze` before merging anything that adds a dependency, and check which
    tier the touched route is actually in before judging the number.
- **Works offline for the things that matter**: membership card, member directory (last
  synced), clinical guidelines. PWA with a service worker, not optional.
- **We do NOT handle MDCN licence payment or renewal.** MDCN has its own portal. We store a
  renewal *date* the member enters, remind them, and deep-link out. Never build a payment
  flow, form, or fee table for MDCN. See `docs/09-DECISIONS.md` ADR-003.
- **WhatsApp is the real channel.** The site never tries to replace it. No in-app chat, no
  forum, no notification system that assumes email works. Outbound = WhatsApp deep links +
  broadcast; email is secondary.
- **NDPA 2023 applies.** Member personal data is regulated. Collect the minimum, never log
  personal data to console or third-party analytics, and read `docs/08-NDPA-COMPLIANCE.md`
  before adding any field to the member profile or any third-party script.

## Stack
Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Firebase (Auth, Firestore,
Cloud Functions, Storage, App Check) · Paystack for dues · deployed on Vercel or Firebase
Hosting. Rationale and rejected alternatives: `docs/02-ARCHITECTURE.md`.

## Rules that will bite you if you ignore them

**1. The client never writes trust fields.**
`members.status`, `members.role`, `members.duesPaidThrough`, and anything in `payments/`
are written **only** by Cloud Functions. Firestore rules must deny client writes to those
paths. Assume any client-supplied value is hostile.

**2. Firestore Security Rules do not apply to the Admin SDK.**
Cloud Functions bypass rules entirely. Every Function that touches member data must
re-check authorisation itself. Never assume "the rules will catch it."

**3. Verify the Paystack webhook signature before trusting it.**
HMAC over the raw request body using the Paystack secret key, compared against the
`x-paystack-signature` header. Use the **raw** body — Next.js/Express body parsers will
break this if you let them JSON-parse first. Reject unsigned requests silently (200, no
body) rather than erroring. Confirm the exact algorithm against Paystack's current docs
before shipping; do not guess it from memory.

**4. Never trust the amount from the client.**
Server computes the dues amount from the member's grade. The client sends an intent, not
a price.

**5. Two-tier identity.** `authenticated` ≠ `verified member`. A signup is just an account.
Member-only data requires a `verified: true` custom claim set by an admin after folio-number
review. Guard on the claim, not on "is logged in."

**6. Denormalise for reads.** Firestore has no joins and reads cost money. Directory listing
reads one document per member from a purpose-built `directoryEntries` collection with only
the public-safe fields — never fan out to full member profiles.

## Conventions
- TypeScript strict. No `any`. Zod schema for every Firestore document and every Function input.
- Server Components by default. `"use client"` only where interaction genuinely requires it.
- No `useEffect` data fetching in Server-Component-capable places.
- All Firestore access goes through `lib/data/*.ts` repository functions. No inline
  `getDocs` in components — it makes the security surface impossible to audit.
- Copy: sentence case, active voice, plain verbs. A button that says "Pay dues" produces a
  confirmation that says "Dues paid." No exclamation marks. No "Oops!"
- Design tokens only — never a raw hex value in a component. See `docs/04-DESIGN-SYSTEM.md`.
- Currency: store kobo as integers. Never floats for money.
- Dates: store ISO 8601 UTC strings or Firestore Timestamps; render in Africa/Lagos.

## Definition of done (every PR)
1. Typechecks, lints, tests pass.
2. Lighthouse mobile performance ≥ 90 on the touched route, throttled to Slow 4G.
3. Keyboard-navigable, visible focus, WCAG 2.2 AA contrast.
4. Firestore rules updated **and** a rules unit test added if data access changed.
5. No new personal-data field without a line added to `docs/08-NDPA-COMPLIANCE.md`.
6. Works with JavaScript slow: no layout shift, no infinite spinner.

## Working style I want from you
- Plan before you code on anything touching auth, payments, or rules. Show the plan.
- Tell me when a request of mine is a bad idea, and why specifically.
- Do not invent Paystack, Firebase, or MDCN API details. If you are unsure of a field name
  or endpoint, say so and check the docs rather than producing plausible code.
- Small commits, conventional commit messages.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
