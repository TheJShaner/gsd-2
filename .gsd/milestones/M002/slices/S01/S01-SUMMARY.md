---
id: S01
parent: M002
milestone: M002
provides:
  - SecretsManifestEntry and SecretsManifest types with status tracking
  - parseSecretsManifest() forgiving regex-based parser
  - formatSecretsManifest() canonical markdown writer
  - secrets-manifest.md template file
  - Secret forecasting instructions in plan-milestone and guided-plan-milestone prompts
  - secretsOutputPath template variable wired through auto.ts and guided-flow.ts
requires: []
affects:
  - S02
  - S03
key_files:
  - src/resources/extensions/gsd/types.ts
  - src/resources/extensions/gsd/files.ts
  - src/resources/extensions/gsd/templates/secrets-manifest.md
  - src/resources/extensions/gsd/tests/parsers.test.ts
  - src/resources/extensions/gsd/prompts/plan-milestone.md
  - src/resources/extensions/gsd/prompts/guided-plan-milestone.md
  - src/resources/extensions/gsd/auto.ts
  - src/resources/extensions/gsd/guided-flow.ts
key_decisions:
  - Secrets manifest uses H3 headings per env var key with bold metadata fields and numbered guidance lists
  - Numbered list extraction via regex rather than reusing parseBullets (which strips numbers)
  - Parser defaults missing optional fields rather than throwing (dashboardUrl/formatHint → empty string, status → pending, destination → dotenv)
  - secretsOutputPath computed via relMilestoneFile(base, mid, "SECRETS") producing paths like .gsd/milestones/M002/M002-SECRETS.md
  - Auto prompt uses structured multi-step format; guided prompt condenses to a single paragraph
patterns_established:
  - Manifest format — H3 heading is the env var key name, bold fields for metadata, numbered list for guidance steps
  - Parser tolerance — invalid status values silently default to pending, missing sections return empty arrays
  - Template variable injection — secretsOutputPath follows the same relMilestoneFile pattern used for other milestone files
observability_surfaces:
  - Parser tests — 7 test groups with 312 assertions exercising all code paths
  - loadPrompt safeguard — throws if secretsOutputPath is declared in template but not provided in vars
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S01/tasks/T02-SUMMARY.md
duration: 27min
verification_result: passed
completed_at: 2026-03-12
---

# S01: Secret Forecasting & Manifest

**Established the secrets manifest contract — types, forgiving parser, canonical formatter, template, planning prompt instructions, and template variable wiring — so milestone planning can produce a parseable `M00x-SECRETS.md` with predicted API keys and step-by-step guidance.**

## What Happened

T01 added the `SecretsManifestEntry` and `SecretsManifest` types to `types.ts`, implemented `parseSecretsManifest()` using existing `extractAllSections(content, 3)` and `extractBoldField` helpers with regex-based numbered list extraction for guidance steps, and `formatSecretsManifest()` producing canonical markdown. Created the `secrets-manifest.md` template. Added 7 comprehensive test groups (312 assertions) to `parsers.test.ts` covering full manifests, single-key, empty, missing optional fields, all status values, invalid status defaulting, and round-trip parse→format→re-parse.

T02 extended both `plan-milestone.md` and `guided-plan-milestone.md` with secret forecasting instructions that tell the LLM to analyze slices for external service dependencies and write a secrets manifest. Wired `secretsOutputPath` through `buildPlanMilestonePrompt()` in `auto.ts` and the guided flow in `guided-flow.ts` via `relMilestoneFile(base, mid, "SECRETS")`.

## Verification

- `npm run build` — passes clean
- `npm run test` — 54 pass, 2 pre-existing failures (initResources sync, npm pack — unrelated)
- 7 manifest parser test groups all pass (full, single-key, empty, missing fields, status values, invalid status, round-trip)
- `secretsOutputPath` variable present in both prompt templates, `auto.ts`, and `guided-flow.ts`
- Both prompts contain skip instruction for milestones with no external APIs
- Both prompts reference the `secrets-manifest.md` template

## Requirements Advanced

- R001 — Planning prompts now instruct the LLM to forecast secrets during milestone planning. Contract established; runtime proof deferred to S04.
- R002 — Manifest file format defined with types, parser, writer, and template. Persistence verified by parser tests; runtime proof deferred to S03/S04.
- R003 — Manifest format includes per-key guidance (numbered steps, dashboard URL, format hint). Content quality is LLM-dependent, tested in S04.
- R009 — Both plan-milestone and guided-plan-milestone prompts contain secret forecasting instructions with the secretsOutputPath variable.

## Requirements Validated

- None — S01 proves the contract (types, parser, formatter, prompt instructions). Runtime validation requires S03 (auto-mode integration) and S04 (end-to-end).

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

None.

## Known Limitations

- Prompt compliance is unproven — the LLM may produce manifests that don't match the template exactly. The forgiving parser mitigates this, but real-world validation is S04's job.
- No runtime code path triggers manifest creation yet — that's S03's auto-mode collect-secrets phase.
- The `guidance` field is defined as `string[]` in the type but `secure_env_collect` doesn't yet support multi-line guidance — that's S02.

## Follow-ups

- None beyond planned S02/S03/S04 work.

## Files Created/Modified

- `src/resources/extensions/gsd/types.ts` — Added SecretsManifestEntryStatus, SecretsManifestEntry, SecretsManifest types
- `src/resources/extensions/gsd/files.ts` — Added parseSecretsManifest() and formatSecretsManifest() with imports
- `src/resources/extensions/gsd/templates/secrets-manifest.md` — New canonical manifest template
- `src/resources/extensions/gsd/tests/parsers.test.ts` — Added 7 manifest parser/formatter test groups (312 assertions)
- `src/resources/extensions/gsd/prompts/plan-milestone.md` — Added Secret Forecasting section with {{secretsOutputPath}}
- `src/resources/extensions/gsd/prompts/guided-plan-milestone.md` — Added Secret Forecasting paragraph with {{secretsOutputPath}}
- `src/resources/extensions/gsd/auto.ts` — Added secretsOutputPath computation and passing in buildPlanMilestonePrompt()
- `src/resources/extensions/gsd/guided-flow.ts` — Added secretsOutputPath computation and passing in guided plan prompt call

## Forward Intelligence

### What the next slice should know
- The manifest parser is intentionally forgiving — it defaults missing fields rather than throwing. S02 should rely on this when reading manifests that may have been partially written.
- `SecretsManifestEntry.guidance` is `string[]` (array of numbered steps). S02's enhanced collection UX should display these as a numbered list, not join them into a paragraph.
- The `destination` field on each entry defaults to `"dotenv"`. S02's `detectDestination()` should set this during collection, not rely on the manifest value.

### What's fragile
- The numbered list regex in `parseSecretsManifest` expects lines like `1. Step text` — if the LLM uses `-` bullets or unnumbered lists, guidance will be empty. The parser doesn't fall back to bullet parsing for guidance. Worth monitoring in S04.

### Authoritative diagnostics
- Run `npm run test` and grep for `parseSecretsManifest` — the 7 test groups are the definitive contract check for the manifest format.
- Grep for `secretsOutputPath` across `auto.ts`, `guided-flow.ts`, and the prompt files to verify wiring.

### What assumptions changed
- No assumptions changed. The plan executed cleanly with no surprises.
