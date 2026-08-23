# 08 — Nigerian Data Protection Act compliance

Not legal advice. This is the engineering checklist; the chapter should have a Nigerian
data-protection practitioner confirm the registration and documentation obligations.

## Why it applies
The site stores personal data of identifiable Nigerians — names, phone numbers, MDCN folio
numbers, facility of practice, payment records. The Nigeria Data Protection Act 2023 governs
this, with the NDPC as regulator. The NDPC has issued substantial fines, including against
large media companies over cross-border data transfers, so this is not theoretical.

## Engineering obligations
1. **Lawful basis and consent.** Directory listing is opt-in per field. Consent is recorded with
   a timestamp and version of the notice consented to. A pre-checked box is not consent.
2. **Data minimisation.** Every field must have a named purpose. If nobody can say why a field
   exists, remove it. Never collect: date of birth, home address, marital status, religion,
   ethnicity, or any health information about the member or their family.
3. **Cross-border transfer.** Firebase stores data on Google Cloud outside Nigeria. This is a
   transfer and must be documented with an adequate-safeguard basis, named in the privacy notice.
   Pick the Firestore region deliberately and record the choice in `09-DECISIONS.md`.
4. **Purpose limitation.** Data collected for membership administration is not used for anything
   else. No selling, no sharing with recruiters or pharmaceutical companies, no matter who asks.
   Write that into the privacy notice as a commitment, because someone will ask.
5. **Security.** App Check on, TLS only, least-privilege rules, no personal data in logs or
   error reports, no personal data in third-party analytics or in URLs. Storage paths namespaced
   by uid.
6. **Rights.** A member can see their data (`/portal/profile`), correct it, export it, and
   request deletion. Build the export in Phase 1; it is three lines of code then and a fire drill
   later. Note that payment records may need retention for financial-record purposes even after
   a deletion request — document the retention period rather than deciding it ad hoc.
7. **Processor agreements.** Google (Firebase), Paystack, the hosting provider and any SMS
   provider are processors. Their terms should be on file.
8. **Breach process.** One named person, a written 72-hour notification path, and a rehearsed
   answer to "what do we tell members." Decide this before you need it.
9. **Registration.** Processing more than a modest number of data subjects triggers controller
   registration duties with the NDPC, and a data-protection contact should be designated.
   Confirm the current threshold and process with a practitioner.

## Special handling: welfare data
Welfare and benevolent-fund cases can shade into health and family information about members
and their dependants. Rule: the system stores **case identifier, requesting member, status, and
amount** only. Narrative detail, diagnoses and family circumstances stay offline with the
Welfare Committee. Do not build a field that invites someone to type a diagnosis into it.

## Change control
**Any pull request that adds a personal-data field must add a row here** stating the field, its
purpose, its lawful basis, its retention period, and who can read it. No row, no merge.

| Field | Purpose | Basis | Retention | Readable by |
|---|---|---|---|---|
| `phone` | contact between colleagues | consent (opt-in) | while a member | self, admin, verified members if opted in |
| `folioNumber` | verify the person is a licensed doctor and an NMA member | legitimate interest / contract | while a member + audit period | self, admin |
| `payments.*` | dues administration and financial records | contract / legal obligation | statutory financial retention period | self, admin |
| `mdcnRenewalMonth` | send the member a reminder they asked for | consent | while a member | self only |
| `displayName` | identify the member on their profile, folio card, and (once verified) the directory | contract (membership administration) | while a member | self, admin; verified members if directory-listed |
| `email` | sign-in identity (email-link auth) and dues-receipt delivery | contract (membership administration) | while a member | self, admin |
| `department` | clinical specialty shown in the directory once verified, and used by an admin to sanity-check a folio submission | contract (membership administration) | while a member | self, admin; verified members if directory-listed |
| `facility` | practice location shown on the folio card, `/verify/[folio]`, and the directory once verified; also an admin cross-check | contract (membership administration) | while a member | self, admin; verified members if directory-listed; public if `publicListingConsent` |
| `grade` | title shown on the folio card and directory (e.g. "Consultant") | contract (membership administration) | while a member | self, admin; verified members if directory-listed; public if `publicListingConsent` |
| `subspecialty` | further specialty detail, directory search | contract (membership administration) | while a member | self, admin; verified members if directory-listed |
| `town` | coarse location for directory search | contract (membership administration) | while a member | self, admin; verified members if directory-listed |
| `whatsapp` | one-tap contact between colleagues | consent (opt-in) | while a member | self, admin, verified members if opted in |
| `publicListingConsent` | governs whether the member's name appears on the public, unauthenticated `/doctors` page | consent | while a member | self, admin |
| `cpdEntries.*` (title, provider, creditUnits, dateAttended) | lets the member hold their own CME/CPD evidence record for MDCN renewal season | contract (membership administration) | while a member | self, admin (only at a known uid — no cross-member query) |
| `cpdEntries.*.certificateUrl` | optional uploaded proof of attendance for a logged CPD entry | consent (member-initiated upload) | while a member | self, admin (only at a known uid) |
| `registrations.*` (eventId, attended) | lets a member register for a chapter event and lets exec confirm real attendance, which is what triggers CPD credit — not registration alone | contract (membership administration) | while a member | self (own registration only), exec/admin |
| `registrations.attendanceMarkedBy` / `attendanceUnmarkedBy` | records which exec member confirmed or reversed an attendance mark — an accountability trail on a write that grants CPD credit, not a record about the attending member | legitimate interest (accountability for a credit-granting action) | while a member | admin only |
| `registrations.attendanceMarkedAt` / `attendanceUnmarkedAt` | timestamps for the same accountability trail | legitimate interest | while a member | self, admin |
| `cpdEntries.*.withdrawnAt` / `withdrawnBy` | when an exec-confirmed entry's attendance is reversed, the entry is marked withdrawn rather than deleted (the member may already have printed it for MDCN) — this is the record of that reversal | legitimate interest (accountability, integrity of a credit record) | while a member | self, admin |
