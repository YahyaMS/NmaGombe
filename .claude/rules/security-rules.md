---
description: Rules and conventions for Firestore security rules and Cloud Functions authorisation
globs: ["firestore.rules", "functions/**", "storage.rules"]
---

# Working on rules or Functions

Stop and plan before editing. Show me the plan first — authorisation bugs here expose the
personal data of every doctor in the chapter.

1. **Deny by default.** Start every match block from no access and add narrowly.
2. **Never trust a document field for authorisation.** Read `role` and `verified` from
   `request.auth.token` (custom claims), never from a Firestore document the client might write.
3. **Security rules do not apply to the Admin SDK.** Any Cloud Function touching member data
   must check authorisation itself. Write the check explicitly even when it feels redundant.
4. **Every rules change ships with a rules unit test that asserts denial.** A test that only
   proves the happy path passes is worse than no test — it creates false confidence.
5. Trust fields are Function-write-only: `members.status`, `members.role`,
   `members.duesPaidThrough`, all of `payments/*`, all of `duesRates/*`.
6. Never widen a rule to fix a client bug. If the client is getting permission-denied, the
   client is asking for the wrong thing.
7. Storage paths are namespaced by uid and guarded by rules. Unguessable URLs are not security.
