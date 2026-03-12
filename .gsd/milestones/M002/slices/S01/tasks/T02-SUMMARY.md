---
id: T02
parent: S01
milestone: M002
provides:
  - Secret forecasting instructions in plan-milestone prompt
  - Secret forecasting instructions in guided-plan-milestone prompt
  - secretsOutputPath variable wired through buildPlanMilestonePrompt() and guided flow
key_files:
  - src/resources/extensions/gsd/prompts/plan-milestone.md
  - src/resources/extensions/gsd/prompts/guided-plan-milestone.md
  - src/resources/extensions/gsd/auto.ts
  - src/resources/extensions/gsd/guided-flow.ts
key_decisions:
  - Secret forecasting section placed after Planning Doctrine, before the final "You MUST write" line in plan-milestone.md
  - Guided prompt uses a single self-contained paragraph instead of the structured multi-step format used in the auto prompt
patterns_established:
  - Template variable secretsOutputPath computed via relMilestoneFile(base, mid, "SECRETS") — produces paths like .gsd/milestones/M002/M002-SECRETS.md
observability_surfaces:
  - loadPrompt throws with a clear error if {{secretsOutputPath}} is declared in template but not provided in vars — this is the existing prompt-loader safeguard
duration: 12 minutes
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T02: Planning prompt modifications and auto.ts wiring

**Added secret forecasting instructions to both milestone planning prompts and wired the `secretsOutputPath` template variable through `buildPlanMilestonePrompt()` and the guided flow.**

## What Happened

Extended both `plan-milestone.md` and `guided-plan-milestone.md` with a "Secret Forecasting" section that instructs the LLM to analyze slices for external service dependencies and write a secrets manifest file. The auto prompt uses a structured multi-step format with explicit field descriptions. The guided prompt condenses the same instructions into a single self-contained paragraph.

Wired `secretsOutputPath` through both code paths:
- `buildPlanMilestonePrompt()` in `auto.ts` computes the path via `relMilestoneFile(base, mid, "SECRETS")` and passes it to `loadPrompt`
- The guided flow in `guided-flow.ts` does the same at the `loadPrompt("guided-plan-milestone", ...)` call site

Both prompts include: the skip instruction for milestones with no external APIs, a reference to the `secrets-manifest.md` template, guidance on dashboard URLs, format hints, and numbered navigation steps.

## Verification

- `npm run build` — TypeScript compiles cleanly
- `npm run test` — 54 pass, 2 pre-existing failures (initResources sync and npm pack tests, verified identical before and after changes)
- Grep `plan-milestone.md` for `{{secretsOutputPath}}` — present
- Grep `guided-plan-milestone.md` for `{{secretsOutputPath}}` — present
- Grep `auto.ts` for `secretsOutputPath` — present in vars object within `buildPlanMilestonePrompt()`
- Grep `guided-flow.ts` for `secretsOutputPath` — present in guided plan prompt call
- Grep both prompts for skip instruction ("skip this step entirely") — present in both
- Grep both prompts for template reference ("secrets-manifest.md") — present in both

### Slice-level verification status

- `npm run test` — ✅ passes (no regressions)
- `npm run build` — ✅ passes
- Manifest parser tests — ✅ (established in T01, still passing)
- Template loads with new `secretsOutputPath` variable — ✅ (loadPrompt safeguard would throw if var was missing)

## Diagnostics

No runtime diagnostics — these are prompt template changes and static variable wiring. Inspection is via reading the prompt files and the `auto.ts`/`guided-flow.ts` source. The `loadPrompt` safeguard throws a clear error if `{{secretsOutputPath}}` is declared in a template but not provided in vars.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/prompts/plan-milestone.md` — Added Secret Forecasting section with `{{secretsOutputPath}}` variable
- `src/resources/extensions/gsd/prompts/guided-plan-milestone.md` — Added equivalent Secret Forecasting paragraph with `{{secretsOutputPath}}`
- `src/resources/extensions/gsd/auto.ts` — Added `secretsOutputPath` computation and passing in `buildPlanMilestonePrompt()`
- `src/resources/extensions/gsd/guided-flow.ts` — Added `secretsOutputPath` computation and passing in guided plan prompt call
