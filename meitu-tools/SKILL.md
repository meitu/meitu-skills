---
name: meitu-tools
description: Meitu 工具能力全集。统一介绍 meitu CLI 的安装、凭证、命令能力与调用方法。覆盖动作迁移、图片编辑、图片生成、图片超清、试衣、图生视频、换头像、抠图。
---

# meitu-tools

## Purpose

统一承载所有单工具能力，并通过一个脚本执行：
- `scripts/run_command.js`

## Runtime

Install CLI:

```bash
npm install -g meitu-ai
```

Credentials (one of two):

1. Env vars:

```bash
export OPENAPI_ACCESS_KEY="..."
export OPENAPI_SECRET_KEY="..."
```

2. File: `~/.meitu/credentials.json` (recommended by Node CLI)

```json
{"accessKey":"...","secretKey":"..."}
```

Legacy fallback is also supported: `~/.openapi/credentials.json`.

## Unified execution

```bash
node "{baseDir}/scripts/run_command.js" --command "<command>" --input-json '<json object>'
```

Output JSON:
- `ok`
- `command`
- `task_id`
- `media_urls`
- `result`

## Runtime maintenance (lazy update)

Default behavior:
- `scripts/run_command.js` will perform lazy npm update checks automatically.
- It does not update every call; it checks by TTL and only installs when stale/outdated.

Env controls:
- `MEITU_AUTO_UPDATE=1|0` (default `1`)
- `MEITU_UPDATE_CHECK_TTL_HOURS=<hours>` (default `24`)
- `MEITU_UPDATE_CHANNEL=<tag>` (default `latest`)
- `MEITU_UPDATE_PACKAGE=<name>` (default `meitu-ai`)

Manual update intent:
- When user asks to update runtime immediately, run:
  - `npm install -g meitu-ai@latest`
  - `meitu --version`
- Typical trigger phrases:
  - “更新 meitu-ai 到最新版本”
  - “检查并修复 meitu 运行时”
  - “现在立即更新 npm 包”

## Capability catalog

1. 动作迁移 `video-motion-transfer`
- required: `image_url`, `video_url`, `prompt`
- optional: none

2. 图片编辑 `image-edit`
- required: `image`, `prompt`
- optional: `size`, `output_format`, `ratio`

3. 图片生成 `image-generate`
- required: `prompt`
- optional: `image`, `size`

4. 图片超清 `image-upscale`
- required: `image`
- optional: `model_type`

5. 试衣 `image-virtual-tryon`
- required: `clothes_image_url`, `person_image_url`
- optional: `replace`, `need_sd`

6. 图生视频 `image-to-video`
- required: `image`, `prompt`
- optional: `video_duration`, `ratio`

7. 换头像 `image-face-swap`
- required: `head_image_url`, `sence_image_url`, `prompt`
- optional: none

8. 抠图 `image-cutout`
- required: `image`
- optional: `model_type`

## Natural-language to command mapping

- 动作迁移 / motion transfer -> `video-motion-transfer`
- 图片编辑 / image edit -> `image-edit`
- 图片生成 / image generate -> `image-generate`
- 图片超清 / upscale -> `image-upscale`
- 试衣 / virtual try-on -> `image-virtual-tryon`
- 图生视频 / image to video -> `image-to-video`
- 换头像 / face swap -> `image-face-swap`
- 抠图 / cutout -> `image-cutout`

## Robust invocation pattern

When the user provides structured execution intent, prefer this shape:

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
