# ARCHITECTURE

## Goal

Use a simple two-layer skill architecture:
- root entry skill (`SKILL.md`) for intent selection
- aggregate tools skill (`meitu-tools`) for all direct tool capabilities
- scene skills (currently `article-to-cover`) for high-level workflows

## Structure

- `SKILL.md`: tells OpenClaw when to use `article-to-cover` vs `meitu-tools`.
- `meitu-tools/SKILL.md`: includes all single-tool capabilities.
- `meitu-tools/scripts/run_command.js`: single execution script (Node runtime + lazy npm update).
- `article-to-cover/SKILL.md`: independent scene skill.

## Extension rules

1. Add a new tool capability
- update `meitu-tools/scripts/run_command.js`
- update `meitu-tools/SKILL.md` capability catalog
- run `scripts/build_aggregate_skill.py`

2. Add a new scene skill
- create `<scene-name>/SKILL.md`
- call `../meitu-tools/scripts/run_command.js` where tool execution is needed
- update root `SKILL.md` selection rules
