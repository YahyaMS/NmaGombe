# 11 — The first Claude Code session

## Before you open the terminal
Fill in these five things in the docs, or Claude will invent them and you will inherit fiction:
1. `docs/00-INTAKE.md` — mark which BLOCKERs are cleared. If item 5 (Paystack) or item 9
   (roster) is open, **do not start Phase 1's dues or directory work.** Build Phase 0 only.
2. `docs/04-DESIGN-SYSTEM.md` — confirm the green against the real crest file.
3. `docs/02-ARCHITECTURE.md` — write in the chosen Firestore region.
4. `docs/01-PRD.md` — replace the dues figures with the Treasurer's actual numbers.
5. Put the crest SVG in `public/brand/` and real photos in `public/photos/`.

## Session 1 — Phase 0 only
Paste this:

> Read CLAUDE.md and every file in docs/ before doing anything. Then scaffold Phase 0 from
> docs/06-ROADMAP.md: Next.js App Router with TypeScript and Tailwind, the design tokens from
> docs/04-DESIGN-SYSTEM.md wired into tailwind.config.ts, self-hosted subset fonts, the Firebase
> client and admin initialisation with emulator support, the PWA shell, and the rules test
> harness. Then build only the public homepage and /about using the real content in docs/ and
> the assets in public/.
>
> Do not build auth, payments, or the directory in this session. Show me your plan before
> writing code, and tell me anything in the docs that is underspecified or that you think is
> wrong rather than guessing.

## Session 2 onward
Use `/feature-slice` to start each feature and `/ship-check` before each commit. Run the
`rules-auditor` subagent after any change to `firestore.rules`, and again before launch.

## Habits that make this project survive
- Run `/init` never — CLAUDE.md is hand-written on purpose. Claude Code's `/doctor` trim check
  will suggest cutting content it can derive from the codebase; accept those cuts, keep the
  pitfalls and rationale.
- Keep CLAUDE.md under about 150 lines. When it grows, move the detail into `docs/` and
  path-scope it in `.claude/rules/`.
- Add an ADR to `docs/09-DECISIONS.md` every time you say "no" to something. In six months you
  will not remember why, and neither will Claude.
- When Claude proposes code touching money or authorisation, ask it what happens if the webhook
  fires twice. If it cannot answer, don't merge it.
