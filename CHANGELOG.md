# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed
- **SSOT unification**: `tools-ssot/tools.yaml` is now the sole data source for both CLI registry and agent descriptions
- Unified generator (`scripts/generate.js`) replaces both the old `generate.js` and `compile-tools.py`, producing 7 downstream artifacts in one pass
- `commands.js` now reads from auto-generated `commands-data.json` instead of inline data
- All 13 tools now have `cli` fields in `tools.yaml`, CLI coverage = 13/13
- `image-try-on` now maps directly to `image-try-on` in the CLI registry
- `image-edit`: added `model` to optionalKeys; documented per-model ratio constraints (praline/nougat/gummy)
- `image-generate`: added `ratio` to optionalKeys (supports 1:1/4:3/3:4/16:9/9:16/3:2/2:3/21:9)
- `text-to-video` added to VIDEO_COMMANDS set in executor.js (uses video timeout)

### Added
- `package.json` with `js-yaml` devDep and `npm run generate` script
- `meitu-tools/scripts/lib/commands-data.json` (auto-generated CLI registry)
- CLI support for 4 new tools: `text-to-video`, `video-to-gif`, `image-poster-generate`, `image-grid-split`
- `CLAUDE.md` project instructions
- `CHANGELOG.md`
- `docs/CLI_UPGRADE.md` — CLI runtime upgrade guide with batch test results and API mapping

### Removed
- `tools-ssot/compile-tools.py` (replaced by unified Node.js generator)

### Batch Test Results (meitu-ai v0.1.4)

Tested 2026-03-20. 6/9 original commands PASS; 4 new commands + 2 new params pending CLI upgrade.

| Command | Status | Note |
|---------|--------|------|
| image-upscale | PASS | |
| image-cutout | PASS | |
| image-edit (praline) | PASS | |
| image-face-swap | PASS | |
| image-try-on | PASS | |
| image-to-video | PASS | |
| image-beauty-enhance | FAIL | Server error 98501 (test image not a portrait) |
| video-motion-transfer | FAIL | Invalid test video URL |
| image-generate --ratio | FAIL | `--ratio` not in CLI v0.1.4 |
| image-edit --model | FAIL | `--model` not in CLI v0.1.4 |
| text-to-video | FAIL | Command not in CLI v0.1.4 |
| video-to-gif | FAIL | Command not in CLI v0.1.4 |
| image-poster-generate | FAIL | Command not in CLI v0.1.4 |
| image-grid-split | FAIL | Command not in CLI v0.1.4 |

## [0.2.0] - 2026-03-19

### Changed
- Refactored `run_command.js` into 5 modules: `commands.js`, `errors.js`, `input.js`, `executor.js`, `updater.js`
- `commands.js` became the unified CLI registry (single source of truth for Phase 1)
- Added `scripts/generate.js` to auto-generate `manifest.json` and SKILL.md capability segments

## [0.1.0] - 2026-03-18

### Added
- Initial skill pack: root `SKILL.md`, `meitu-tools/`, `article-to-cover/`
- `run_command.js` monolithic runner with 9 built-in commands
- Lazy runtime auto-update for `meitu-ai` CLI
- `tools-ssot/tools.yaml` with 13 tool definitions
- `compile-tools.py` for generating agent descriptions, CSV, disambiguation matrix
- Bootstrap guidance and secret self-check in README
