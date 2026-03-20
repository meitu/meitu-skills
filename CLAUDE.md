# CLAUDE.md

Project-level instructions for Claude Code working on `meitu-skills`.

## Project Overview

OpenClaw skill pack for Meitu image/video AI tools. Two-layer architecture:
- Root `SKILL.md` routes between scene skills (`article-to-cover`) and tool aggregate (`meitu-tools`)
- `meitu-tools/` wraps 13 CLI commands via `run_command.js`
- `tools-ssot/tools.yaml` is the **sole human-maintained data file** (13 tools, all with CLI support)

## Key Commands

```bash
npm run generate          # regenerate all 7 downstream artifacts from tools.yaml
node meitu-tools/scripts/run_command.js --command <cmd> --input-json '<json>'
```

## SSOT Data Flow

```
tools-ssot/tools.yaml  (edit here only)
    └── npm run generate
        ├── meitu-tools/scripts/lib/commands-data.json
        ├── meitu-tools/generated/manifest.json
        ├── meitu-tools/SKILL.md  (capability catalog segment)
        ├── SKILL.md  (tool map segment)
        ├── tools-ssot/agent-descriptions.yaml
        ├── tools-ssot/tools-overview.csv
        └── tools-ssot/disambiguation-matrix.md
```

## Rules

- **Never hand-edit generated files.** Edit `tools.yaml`, then `npm run generate`.
- Tools with `cli` field go into CLI pipeline (commands-data.json, manifest, SKILL.md catalogs).
- CLI registry key = `cli.command || id` (e.g., `image-try-on` has `cli.command: image-virtual-tryon`).
- `commands.js` export interface must stay stable — `run_command.js`, `input.js`, `executor.js` depend on it.
- Commit format: `<type>: <description>` (feat, fix, refactor, docs, chore).
- Language: code and commits in English; tool names/summaries/aliases in Chinese per tools.yaml conventions.
- No secrets in code — use env vars `OPENAPI_ACCESS_KEY` / `OPENAPI_SECRET_KEY` or `~/.meitu/credentials.json`.

## Tool ↔ API Mapping

tools.yaml 中的工具 id 与后端 MCP API name 对应关系（从 `preinternal-aigc.meitu.com` 获取）：

| tool id | backend API name | CLI command |
|---------|-----------------|-------------|
| `image-generate` | `image_gummy_create_v50` | `image-generate` |
| `image-poster-generate` | `image_poster_generate` | `image-poster-generate` |
| `text-to-video` | `video_bonbon_txt2vid_v26` | `text-to-video` |
| `video-to-gif` | `api_video_to_gif` | `video-to-gif` |
| `image-grid-split` | `api_quad_split` | `image-grid-split` |

## CLI Runtime Compatibility

当前 `meitu-ai` CLI 版本 **0.1.4** 支持 9 个原始命令。4 个新命令（`text-to-video`, `video-to-gif`, `image-poster-generate`, `image-grid-split`）及 2 个新参数（`image-edit --model`, `image-generate --ratio`）需要 CLI 发布新版本后才可用。tools.yaml 已提前配置完毕，CLI 升级后即可生效。

## Adding a New Tool

1. Add entry in `tools-ssot/tools.yaml` (with `cli` field)
2. Run `npm run generate`
3. Validate: `node meitu-tools/scripts/run_command.js --command <cmd> --input-json '{...}'`

See `docs/ADD_COMMAND.md` for details.
