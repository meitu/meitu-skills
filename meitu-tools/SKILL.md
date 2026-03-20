---
name: meitu-tools
description: Unified Meitu CLI capability skill. Covers installation, credentials, command mapping, execution pattern, and user-facing error guidance for all built-in image/video commands.
---

# meitu-tools

## Purpose

This skill is the single tool-execution hub for Meitu CLI commands.
Use one runner script for all supported commands:
- `scripts/run_command.js`

## Runtime Alignment

This skill is aligned with the Node.js `openapi-cli` command set.
Current built-in command coverage:
- `video-motion-transfer`
- `image-edit`
- `image-generate`
- `image-upscale`
- `image-virtual-tryon`
- `image-to-video`
- `image-face-swap`
- `image-cutout`
- `image-beauty-enhance`

Notes:
- No effect IDs are exposed in skill prompts.
- Command routing is done by built-in Meitu CLI commands.

## Install Runtime

```bash
npm install -g meitu-ai
meitu --version
```

If an existing `meitu` binary conflicts:

```bash
npm install -g meitu-ai@latest --force
```

## Agent Bootstrap Policy (Must Follow)

Agent behavior should optimize for zero-setup user experience:
- Always try execution via `scripts/run_command.js` first.
- Do not require user to install CLI before first attempt.
- Keep `MEITU_AUTO_UPDATE=1` unless the user explicitly disables it.
- Let the runner handle lazy install/update checks automatically.

If runtime bootstrap fails, return concrete repair actions:
- Standard repair:

```bash
npm install -g meitu-ai
meitu --version
```

- If conflict error (`EEXIST`) appears:

```bash
npm install -g meitu-ai@latest --force
meitu --version
```

## Credentials

Use one of the following:

1. Environment variables:

```bash
export OPENAPI_ACCESS_KEY="..."
export OPENAPI_SECRET_KEY="..."
```

2. Credentials file (recommended): `~/.meitu/credentials.json`

```json
{"accessKey":"...","secretKey":"..."}
```

Legacy fallback is supported:
- `~/.openapi/credentials.json`

## Unified Execution

```bash
node "{baseDir}/scripts/run_command.js" --command "<command>" --input-json '<json object>'
```

Expected output JSON fields:
- `ok`
- `command`
- `task_id`
- `media_urls`
- `result`

## Lazy Runtime Update

Default behavior:
- `run_command.js` performs lazy npm update checks automatically.
- It does not update on every call.
- It checks by TTL and updates only when stale or outdated.

Environment controls:
- `MEITU_AUTO_UPDATE=1|0` (default `1`)
- `MEITU_UPDATE_CHECK_TTL_HOURS=<hours>` (default `24`)
- `MEITU_UPDATE_CHANNEL=<tag>` (default `latest`)
- `MEITU_UPDATE_PACKAGE=<name>` (default `meitu-ai`)
- `MEITU_ORDER_URL=<url>` (order/renewal page for insufficient quota)
- `MEITU_TASK_WAIT_TIMEOUT_MS=<ms>` (default `600000` for video commands, `900000` for others)
- `MEITU_TASK_WAIT_INTERVAL_MS=<ms>` (default `2000`)

Manual update intent:
- If the user explicitly asks for an immediate runtime update, run:

```bash
npm install -g meitu-ai@latest
meitu --version
```

## Error Contract (Must Be User-Visible)

When execution fails, runner output includes:
- `error_type`
- `error_code`
- `error_name`
- `user_hint`
- `next_action`
- `action_url` (when order/recharge is required)

Mandatory behavior:
- For `ORDER_REQUIRED`, explicitly tell the user to place an order/recharge first.
- If `action_url` exists, provide it directly.
- For `CREDENTIALS_MISSING`, ask the user to configure AK/SK first, then retry.

## Capability Catalog

1. `video-motion-transfer`
- required: `image_url`, `video_url`, `prompt`
- optional: none

2. `image-edit`
- required: `image`, `prompt`
- optional: `size`, `output_format`, `ratio`

3. `image-generate`
- required: `prompt`
- optional: `image`, `size`

4. `image-upscale`
- required: `image`
- optional: `model_type`

5. `image-virtual-tryon`
- required: `clothes_image_url`, `person_image_url`
- optional: `replace`, `need_sd`

6. `image-to-video`
- required: `image`, `prompt`
- optional: `video_duration`, `ratio`

7. `image-face-swap`
- required: `head_image_url`, `sence_image_url`, `prompt`
- optional: none

8. `image-cutout`
- required: `image`
- optional: `model_type`

9. `image-beauty-enhance`
- required: `image`
- optional: `beatify_type`

## Natural Language Mapping

Typical intent-to-command mapping:
- motion transfer -> `video-motion-transfer`
- image edit -> `image-edit`
- image generate -> `image-generate`
- image upscale -> `image-upscale`
- virtual try-on -> `image-virtual-tryon`
- image to video -> `image-to-video`
- face swap -> `image-face-swap`
- image cutout -> `image-cutout`
- beauty enhancement -> `image-beauty-enhance`

## Robust Invocation Pattern

When the user provides structured execution intent, prefer:

```text
Use meitu-tools.
command: image-edit
input: {"image":["https://..."],"prompt":"..."}
```

Or via slash command:

```text
/skill meitu-tools
command=image-edit
input={"image":["https://..."],"prompt":"..."}
```
