---
name: seed-directory
description: Import the chapter membership roster into Firestore as unclaimed directory entries. Use for the launch seed and for roster refreshes.
---

# Seed the directory

An empty directory kills the launch, so the roster is imported before any member signs up.

Rules for this task:
- **Never run against production without an explicit instruction naming the environment.**
  Default to the emulator.
- Input is a CSV. Validate every row with Zod before writing anything; report bad rows rather
  than silently skipping them.
- Seeded entries are written to `directoryEntries/{generatedId}` with `claimed: false` and
  **no contact details** — phone and WhatsApp stay absent until the member claims the entry and
  opts in. The roster's phone numbers do not get published by import.
- Normalise specialty names against a controlled vocabulary. "O&G", "Obs and Gynae" and
  "Obstetrics & Gynaecology" must collapse to one value or search is useless.
- Idempotent: re-running with the same CSV updates rather than duplicates. Match on folio number.
- The roster is regulated personal data. Do not print it to the console, do not commit the CSV,
  and confirm the CSV path is in `.gitignore` before you start.
- Report: rows read, written, updated, rejected — with reasons.
