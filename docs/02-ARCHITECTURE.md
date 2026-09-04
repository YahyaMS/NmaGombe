# 02 — Architecture

## Stack
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js, App Router, TypeScript** | Public pages need server rendering for SEO and fast first paint on costly mobile data; the portal needs real interactivity. One codebase does both. |
| Styling | **Tailwind + design tokens**, shadcn/ui for primitives | Tokens keep the palette enforceable; shadcn is copy-in, so no runtime component library weight. |
| Auth | **Firebase Auth** (email-link primary; phone OTP a possible later upgrade) | Phone OTP needs the Blaze plan for SMS before anyone can sign up — see ADR-010. Email-link runs on Spark and needs no Dynamic Links dependency for a web app. |
| Database | **Cloud Firestore** | Best-in-class offline persistence, which matters more here than query power. Shared with a future React Native app. |
| Server logic | **Cloud Functions** | Payment webhooks, receipt generation, custom claims, scheduled reminders. |
| Files | **Firebase Storage** | Certificates, photos, exec portraits. |
| Abuse control | **App Check** | Meant to stop scripted scraping of the directory — non-optional given the data is personal. Client-side wiring exists (`lib/firebase/app.ts`); enforcement is not yet on. See ADR-020. |
| Payments | **Paystack** (unscheduled — see ADR-021 below; no Paystack code exists in this repo) | Local cards + bank transfer, subscriptions available, straightforward webhooks. |
| Hosting | **Vercel** or Firebase Hosting | Either is free at this scale. Vercel handles Next.js server rendering with less configuration. |
| CMS | **Custom Firestore-backed admin** | See ADR-005. A headless CMS is a second system to maintain and pay for; the Secretary needs three forms, not an editorial platform. |

## Data flow that matters: paying dues
**Not built. Deferred to Version 3, unscheduled — see `09-DECISIONS.md` ADR-021.** Kept here as
the intended design for when that work starts, not a description of anything that exists today.
```
member taps "Pay dues"
  → Function initializes a Paystack transaction (amount computed server-side from grade)
  → member completes payment on Paystack
  → Paystack POSTs the webhook to a Function
      → verify signature over the RAW body; reject silently if invalid
      → idempotency check on the Paystack reference (webhooks retry!)
      → write payments/{ref} and update members/{uid}.duesPaidThrough
      → generate receipt PDF to Storage; email + WhatsApp deep-link the member
  → client listens on its own member doc and updates the card
```
The client is never in the trust path. It never reports success; it observes it.

## Rejected alternatives (short version; full reasoning in 09-DECISIONS.md)
- **Plain React SPA** — poor SEO on public pages, heavier client bundle on expensive data. No.
- **Astro** — genuinely lighter for content, but the portal is more app than document, and
  splitting content and app across two frameworks doubles the maintenance surface for a
  volunteer-run project.
- **Supabase** — honestly the better *access-control* story: Postgres Row-Level Security is one
  model enforced in the database, versus Firestore rules plus separate Admin-SDK checks. We stay
  on Firebase because of existing team fluency, offline persistence, and the future React Native
  app. Revisit if Firestore read costs or rule complexity become the bottleneck.
- **WordPress** — what the parent site does, and why it looks the way it does.

## Cost of ownership (annual, order of magnitude, verify current prices)
- Domain `.org.ng`: low single-digit thousands of Naira.
- Hosting: free tier is genuinely sufficient at this scale.
- Firebase Blaze: near-zero for a few thousand members, *if* reads are denormalised. Firestore
  bills per document read — a badly written directory query is the one thing that could make
  this expensive.
- **Phone OTP is the real cost risk.** SMS verification is billed per message and is the most
  likely line item to surprise you. Cap OTP attempts per number per day; consider email as the
  default and phone OTP as an upgrade for verified members only.
- Paystack (once built — see the deferred payments note above): percentage per transaction,
  capped; borne against dues, not the IT budget.
- WhatsApp: free via click-to-chat links and broadcast lists. Only the Business API costs money,
  and we don't need it in Phase 1.

Prices move. Confirm on the official Paystack, Firebase and registrar pages before budgeting.

## Environments and secrets
- **One Firebase project, `nma-gombe-c5a9d` — not the dev/prod split this section originally
  specified.** That was the original plan; it was deliberately rejected. See
  `09-DECISIONS.md` ADR-009 for why, and don't re-propose it without reading that ADR first.
  Local development runs against the same project's **emulators**, never the live project
  directly.
- Whenever Paystack work actually starts (see the payments note above — unscheduled, ADR-021):
  live keys must exist only in the hosting provider's secret store, never in `.env.local`, never
  in the repo, never in a WhatsApp message. This is forward guidance, not a description of a
  control that exists today — there are no live keys to protect yet.
- Root ownership of every account sits on a chapter-controlled email in a shared vault.

## Future: the React Native app
Same Firebase project. Auth, Firestore, Storage and Functions are reused as-is; only the UI is
new. Keep all business logic in Functions and `lib/data/*` so it is not trapped in React
components. That single discipline is what makes the mobile app a few weeks instead of a rewrite.
