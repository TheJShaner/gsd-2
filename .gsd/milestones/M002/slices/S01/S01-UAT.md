# S01: Secret Forecasting & Manifest — UAT

**Milestone:** M002
**Written:** 2026-03-12

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is a contract slice — types, parser, formatter, template, and prompt instructions. No runtime behavior to test. All verification is via automated tests, build checks, and file content inspection.

## Preconditions

- Repository checked out with S01 changes applied
- Node.js available for `npm run build` and `npm run test`

## Smoke Test

Run `npm run test` — all `parseSecretsManifest` test groups should pass (7 groups visible in output).

## Test Cases

### 1. Manifest parser handles well-formed input

1. Run `npm run test`
2. Look for `parseSecretsManifest: full manifest with 3 keys` test group
3. **Expected:** All assertions pass — 3 entries parsed with correct key, service, dashboardUrl, guidance steps, formatHint, status, and destination

### 2. Round-trip preserves semantic content

1. Run `npm run test`
2. Look for `parseSecretsManifest + formatSecretsManifest: round-trip` test group
3. **Expected:** Parsing a manifest, formatting it, and re-parsing produces identical data

### 3. Template loads with secretsOutputPath variable

1. Run `grep -n 'secretsOutputPath' src/resources/extensions/gsd/auto.ts src/resources/extensions/gsd/guided-flow.ts`
2. **Expected:** Variable is computed via `relMilestoneFile` and passed to `loadPrompt` in both files

### 4. Prompts contain forecasting instructions

1. Run `grep 'Secret Forecasting\|secretsOutputPath\|skip this step entirely' src/resources/extensions/gsd/prompts/plan-milestone.md src/resources/extensions/gsd/prompts/guided-plan-milestone.md`
2. **Expected:** Both prompts contain the forecasting section header or instructions, the `{{secretsOutputPath}}` variable, and the skip instruction

### 5. Build succeeds

1. Run `npm run build`
2. **Expected:** Clean compilation, no type errors

## Edge Cases

### Empty/no-secrets manifest

1. Run `npm run test`
2. Look for `parseSecretsManifest: empty/no-secrets manifest` test group
3. **Expected:** Returns a manifest object with zero entries — no errors thrown

### Missing optional fields

1. Run `npm run test`
2. Look for `parseSecretsManifest: missing optional fields default correctly` test group
3. **Expected:** dashboardUrl defaults to empty string, formatHint defaults to empty string, status defaults to "pending", destination defaults to "dotenv"

### Invalid status values

1. Run `npm run test`
2. Look for `parseSecretsManifest: invalid status defaults to pending` test group
3. **Expected:** Unrecognized status values silently default to "pending"

## Failure Signals

- Any `parseSecretsManifest` test group failing
- `npm run build` producing type errors in types.ts or files.ts
- `secretsOutputPath` missing from auto.ts or guided-flow.ts grep output
- Prompt files missing `{{secretsOutputPath}}` variable

## Requirements Proved By This UAT

- R001 — Contract proven: prompt instructions exist, manifest types and parser established. Runtime proof deferred to S04.
- R002 — Contract proven: manifest format defined with parser, writer, template. Persistence tested via fixture data.
- R003 — Contract proven: manifest format includes guidance (string[]), dashboardUrl, formatHint per key.
- R009 — Fully proven: both planning prompts contain forecasting instructions with secretsOutputPath variable.

## Not Proven By This UAT

- R001 runtime: actual LLM compliance — does the LLM produce a parseable manifest? (S04)
- R002 runtime: manifest file actually written to disk during planning (S03/S04)
- R003 quality: is the LLM-generated guidance actually useful? (S04, human judgment)
- R004–R008, R010: not in S01 scope (S02, S03)

## Notes for Tester

All verification is automated — run `npm run build` and `npm run test`. No manual runtime testing needed for this slice. The 2 pre-existing test failures (initResources sync, npm pack) are unrelated to S01 changes.
