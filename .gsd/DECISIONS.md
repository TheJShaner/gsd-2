# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001/S01 | arch | Exclusion filter for smart staging | Not file ownership tracking | Simpler, covers the use case | No |
| D002 | M001/S01 | pattern | Thin facade pattern for worktree.ts migration | Preserve all exports, delegate to GitServiceImpl | Backward compatibility without breaking consumers | No |
| D003 | M001/S01 | convention | Branch lifecycle after squash merge | Branches deleted after merge | Clean branch list, history preserved in squash commit | No |
| D004 | M001/S01 | arch | Snapshot storage mechanism | Hidden refs (refs/gsd/snapshots/) not checkpoint commits | Invisible to normal git log, recoverable when needed | No |
| D005 | M002 | arch | Secret guidance source | LLM-generated at planning time | No static database to maintain, adapts to any service | Yes — if accuracy becomes a problem |
| D006 | M002 | arch | Secret collection timing | Up-front during planning only | Solves the primary blocking problem; existing fallback behavior unchanged | Yes — if missed secrets are frequent |
| D007 | M002 | arch | Secret forecasting scope | Current milestone only | Later milestones may change; collect when planning each | Yes — if cross-milestone friction observed |
| D008 | M002 | arch | Existing key handling | Silent skip (no confirmation) | Less friction on repeated runs | Yes — if users want to rotate keys |
| D009 | M002 | arch | Destination detection | Infer from project context (vercel.json, convex/ dir) | User shouldn't specify — falls back to .env | No |
| D010 | M002/S01 | convention | Secrets manifest format | H3 headings per env var key with bold metadata fields and numbered guidance lists | Matches existing GSD markdown conventions (roadmap uses H2, plan uses checkboxes); H3 per key enables extractAllSections(content, 3) reuse | No |
| D011 | M002/S01 | pattern | Guidance list parsing strategy | Regex-based numbered list extraction, not parseBullets | parseBullets strips numbering which loses ordering semantics for step-by-step guidance | No |
| D012 | M002/S01 | convention | Prompt style for secret forecasting instructions | Auto prompt: structured multi-step; guided prompt: single self-contained paragraph | Auto prompt has more structure for LLM reliability; guided prompt is shorter since the agent session is interactive | No |
