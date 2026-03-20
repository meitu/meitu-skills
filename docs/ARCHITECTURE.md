# ARCHITECTURE

## Goal

Use a simple two-layer skill architecture:
- root entry skill (`SKILL.md`) for intent selection
- aggregate tools skill (`meitu-tools`) for all direct tool capabilities
- scene skills (currently `article-to-cover`) for high-level workflows

## Data Flow (SSOT)

```
tools-ssot/tools.yaml  ← sole human-maintained data file
    │
    └── node scripts/generate.js  (npm run generate)
        │
        ├── meitu-tools/scripts/lib/commands-data.json  (CLI registry)
        ├── meitu-tools/generated/manifest.json
        ├── meitu-tools/SKILL.md  (capability catalog segment)
        ├── SKILL.md  (tool map segment)
        ├── tools-ssot/agent-descriptions.yaml
        ├── tools-ssot/tools-overview.csv
        └── tools-ssot/disambiguation-matrix.md
```

## Structure

- `SKILL.md`: tells OpenClaw when to use `article-to-cover` vs `meitu-tools`.
- `meitu-tools/SKILL.md`: includes all single-tool capabilities.
- `meitu-tools/scripts/run_command.js`: entry point — arg parsing + main orchestration.
- `meitu-tools/scripts/lib/commands.js`: reads `commands-data.json`, builds registry + derived views.
- `meitu-tools/scripts/lib/commands-data.json`: auto-generated from `tools.yaml` (CLI registry data).
- `meitu-tools/scripts/lib/errors.js`: error classification and hint generation.
- `meitu-tools/scripts/lib/input.js`: input alias resolution, validation, credentials.
- `meitu-tools/scripts/lib/executor.js`: CLI invocation and result extraction.
- `meitu-tools/scripts/lib/updater.js`: lazy runtime update and version management.
- `article-to-cover/SKILL.md`: independent scene skill.

## Extension rules

1. Add a new tool capability
- add one entry in `tools-ssot/tools.yaml` with `cli` field
- run `npm run generate` to update all downstream artifacts
- see `docs/ADD_COMMAND.md` for details

2. Add a new scene skill
- create `<scene-name>/SKILL.md`
- call `../meitu-tools/scripts/run_command.js` where tool execution is needed
- update root `SKILL.md` selection rules
