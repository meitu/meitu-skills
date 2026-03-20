# VERSIONING

## Pack versioning

Use SemVer for this repository:
- MAJOR: incompatible runner/input contract changes
- MINOR: new command capabilities, backward-compatible behavior
- PATCH: bugfixes and docs updates

## Runtime compatibility

Target runtime:
- `meitu` command from `meitu-ai`

Runner command resolution order:
1. `MEITU_AI_CMD` env override
2. `meitu`
