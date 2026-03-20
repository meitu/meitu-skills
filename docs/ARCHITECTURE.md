# ARCHITECTURE

## Goal

Use a scalable skill-pack layout for GitHub publishing and OpenClaw consumption:
- one base tool skill (`meitu-ai`)
- multiple scenario skills
- one runner script owned by the base tool skill

## Why this structure

1. Clear invocation boundary
- Base tool ability and business scenarios are decoupled.

2. Easier extension
- Add a new scenario skill without changing tool internals.

3. Stable maintenance
- All command validation and output normalization stay in one place.

## Current pattern

- Base tool skill: `meitu-ai/`
- Runner script: `meitu-ai/scripts/run_command.py`
- Scenario skills: `meitu-*` and `article-to-cover`
- Scenario skills call the runner via `../meitu-ai/scripts/run_command.py`

## Add a new built-in command

1. Update `meitu-ai/scripts/run_command.py`:
- add command spec
- add optional Chinese command alias
- add input key aliases if needed

2. Update `meitu-ai/SKILL.md` command list if needed.

## Add a new scenario skill

1. Create a new folder:
- `<scenario-name>/SKILL.md`

2. In the scenario SKILL, call:

```bash
python3 "{baseDir}/../meitu-ai/scripts/run_command.py" --command "<built-in-command>" --input-json '<json object>'
```

3. Add example and docs:
- update `examples/`
- update `README.md`
