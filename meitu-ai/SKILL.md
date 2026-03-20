---
name: meitu-ai
description: meitu-ai 工具能力 Skill。集中维护安装、凭证、命令映射与统一执行入口。其他场景 Skill 按需调用本 Skill 的脚本。
---

# meitu-ai

## Purpose

统一提供 meitu-ai 命令能力，避免在每个场景 Skill 中重复维护安装与参数规范。

## Built-in commands

- `video-motion-transfer`（动作迁移）
- `image-edit`（图片编辑）
- `image-generate`（图片生成）
- `image-upscale`（图片超清）
- `image-virtual-tryon`（试衣）
- `image-to-video`（图生视频）
- `image-face-swap`（换头像）
- `image-cutout`（抠图）

## Runtime setup

Install:

```bash
pipx install --force meitu-ai
```

Credentials (one of two):

1. Env vars:

```bash
export OPENAPI_ACCESS_KEY="..."
export OPENAPI_SECRET_KEY="..."
```

2. File:

`~/.openapi/credentials.json`

```json
{
  "accessKey": "...",
  "secretKey": "..."
}
```

## Execution

```bash
python3 "{baseDir}/scripts/run_command.py" --command "<built-in-command>" --input-json '<json object>'
```

## Output

Unified JSON:
- `ok`
- `command`
- `task_id`
- `media_urls`
- `result`

## Notes for scenario skills

- 场景 Skill 应优先通过本 Skill 的 `scripts/run_command.py` 调用能力。
- 场景 Skill 里只保留业务上下文、触发时机和最小输入说明。
