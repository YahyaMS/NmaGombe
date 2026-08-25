---
description: Server/client boundary and serialization rules for Next.js App Router + Firestore. The bugs in here are not caught by tsc or eslint.
globs: ["app/**", "components/**", "lib/**", "proxy.ts"]
---

# The boundary rules

Nearly every "silly error that should have been caught at build time" on this project is one
of the eight below. They are not type errors. `tsc` passes, the editor is green, and the page
throws at runtime. Read this before writing any component.

## 1. Firestore documents are not serializable — convert at the boundary
A Firestore `Timestamp`, `DocumentReference` or `GeoPoint` cannot cross from a Server Component
to a Client Component. React throws *"Only plain objects can be passed to Client Components."*

**Never pass a raw Firestore document into a client component.** Every repository function in
`lib/data/*` returns a plain object — Timestamps already converted to ISO strings, refs already
resolved to ids. Do the conversion in the repository, never in the component, so there is one
place to be right.

```ts
// lib/data/members.ts
function toPlain(snap): Member {
  const d = snap.data();
  return { id: snap.id, ...d, createdAt: d.createdAt.toDate().toISOString() };
}
```

## 2. Dates: format on the client, or hydration mismatches
Rendering a date server-side in the server's timezone and again client-side in the browser's
produces a hydration mismatch. We render in Africa/Lagos — pass the ISO string down and format
in a client component with an explicit `timeZone: "Africa/Lagos"`, or format server-side with
that timezone pinned. Never rely on the ambient locale on either side.

## 3. `server-only` and `client-only` are the enforcement, not discipline
Any module touching the Admin SDK, a service account, or a secret starts with
`import "server-only"`. That converts "accidentally imported into a client bundle" from a
silent credential leak into a build error. `lib/firebase/admin.ts` already does this — every
new server module must too.

## 4. `"use client"` is a boundary, and it is contagious
Everything imported by a client component becomes client code, including the Firebase SDK.
This is how a 200KB route budget gets blown by one stray import. Push `"use client"` as far
down the tree as possible: a page stays a Server Component and renders a small client island,
never the other way round.

## 5. `cookies()` and `headers()` opt the route out of static rendering
Calling either — anywhere in the tree, including a shared layout — makes the route dynamic.
This is why session state must not be read in the root layout. See the session-cookie ADR.

## 6. Functions cannot be passed from Server to Client Components
No `onClick`, no callbacks, no class instances across the boundary. Only plain data. If a
Server Component needs to trigger behaviour, it renders a client island that owns the handler.

## 7. `NEXT_PUBLIC_*` is inlined only on literal property access
`process.env.NEXT_PUBLIC_FOO` works. Destructuring `process.env`, or indexing it with a
variable, yields `undefined` in the browser with no warning. **Import from `lib/env.ts`
instead of reading `process.env` anywhere else** — it validates at startup and names the
missing variable.

## 8. Proxy runs on the Node.js runtime now — that still doesn't make it authorisation
Next.js 16 deprecated `middleware.ts` and renamed the convention to `proxy.ts` (same
capability, new name — run the codemod, don't hand-rename). The bigger change: **Proxy
defaults to the Node.js runtime, not Edge, as of v16.0.0.** `firebase-admin` and other
Node-only APIs can run directly inside it — this project's `src/proxy.ts` does exactly
that, calling `verifySession()` (Admin SDK) instead of only checking a cookie's
*presence*, which is all Edge-runtime middleware could ever do on Next 15 and earlier.

That does not make Proxy authorisation on its own. `src/proxy.ts` calls `verifySession`
with `checkRevoked: false` deliberately — it's the fast, cheap first pass, not the
authoritative check. Per Next's own docs, a matcher change or a Server Function moved to
a different route can silently lose Proxy coverage, so the real, `checkRevoked: true`
re-check still happens server-side in the route itself (here, the `/portal` and `/admin`
layouts). See `docs/09-DECISIONS.md` ADR-015 and `docs/05-ROUTES.md`'s route-level rules.

---

## Before reporting a slice done
`npm run typecheck && npm run lint && npm run build && npm run test && npm run test:rules && npm run check:routes`

**`npm run build` is the one that matters here.** Typecheck and lint catch none of items 1–8.
The build catches most of them. Do not report a slice complete without a clean build — and do
not report it complete because the dev server rendered the page, because `next dev` is more
forgiving than `next build`.
