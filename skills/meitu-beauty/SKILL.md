---
name: meitu-beauty
description: "对人像照片进行 AI 美颜处理（磨皮、美白、精修五官）。当用户提到美颜、磨皮、美白、精修、beautify、beauty enhance、让照片更好看时触发。仅支持单人照片。"
version: "1.1.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY"],"paths":{"read":["~/.meitu/credentials.json","~/.openclaw/workspace/visual/"],"write":["~/.openclaw/workspace/visual/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
requirements:
  credentials:
    - name: MEITU_OPENAPI_ACCESS_KEY
      source: env | ~/.meitu/credentials.json
    - name: MEITU_OPENAPI_SECRET_KEY
      source: env | ~/.meitu/credentials.json
  permissions:
    - type: file_read
      paths:
        - ~/.meitu/credentials.json
        - ~/.openclaw/workspace/visual/
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
    - type: exec
      commands:
        - meitu
---

# Meitu Beauty

## Overview

一键 AI 美颜：磨皮、美白、精修五官。调用 `meitu image-beauty-enhance`，仅支持单人人像照片。

## Dependencies

- **meitu-cli** ≥ 0.1.9 — `npm install -g meitu-cli`
- **凭证配置**: `meitu config set-ak --value "..."` + `meitu config set-sk --value "..."` 或环境变量 `MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context: 跳过（工具型美颜，无创意自由度）] → Execute → Deliver
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-beauty/`
   `mkdir -p {output_dir}`

### Execute

**输入获取**

用户提供图片，接受以下形式：
- 本地文件路径 → 使用 `--image <path>`
- 图片 URL → 使用 `--image <url>`
- 对话中直接发送的图片 → 保存到临时文件后使用 `--image <path>`

若用户未提供图片，主动询问："请提供需要美颜的人像照片（文件路径或 URL）。"

**人像校验（关键前置步骤）**

此工具仅支持单人人像。调用前 MUST 校验：

1. 读取用户提供的图片，目视检查：
   - 是否包含人脸 → 无人脸则拒绝："这张图片中没有检测到人像，美颜工具仅支持包含人脸的照片。"
   - 是否为单人 → 多人则拒绝："检测到多人，美颜工具仅支持单人照片。请裁剪为单人后重试。"
   - 人脸是否足够大且清晰 → 人脸过小/模糊则警告："人脸较小/模糊，美颜效果可能不明显，是否继续？"

2. 若无法预判（如 URL 无法预览），直接调用工具，根据返回错误处理。

**强度选择**

| 用户意图 | `--beatify_type` | 说明 |
|----------|------------------|------|
| "自然美颜"、"轻微调整"、"稍微美化"、未指定强度 | `0` | 自然效果（默认） |
| "大力美颜"、"重度磨皮"、"效果强一点"、"狠狠美颜" | `1` | 增强效果 |

**调用命令**

```bash
meitu image-beauty-enhance \
  --image <url_or_path> \
  --beatify_type <0|1> \
  --json \
  --download-dir {output_dir}
```

> **注意**: 参数拼写是 `--beatify_type`（非 `--beautify_type`），这是 CLI 的已知拼写。

**结果处理**

- `ok: true` → `--download-dir` 已指定，从 `downloaded_files[0].saved_path` 获取本地文件路径；若未使用 `--download-dir`，从 `media_urls[0]` 获取结果图片 URL
- `ok: false` → 进入错误降级

**错误降级**

先检查 `error_name` 分流，再按级别降级：

| error_name | 处理 | 可重试 |
|------------|------|--------|
| `CONTENT_REQUIREMENTS_UNMET` (code 98501) | 图片不含人脸或不符合单人要求。直接告知用户："该图片不符合美颜要求（需要单人人像照片），请更换图片。" 不重试。 | 否 |
| `ORDER_REQUIRED` | 余额不足，提示充值，展示 `action_url` | 否 |
| `CREDENTIALS_MISSING` | 提示配置 AK/SK | 否 |
| 其他错误 | 按以下级别降级 ↓ | 视情况 |

通用降级（仅 `retryable: true` 或未知错误时）：

| 级别 | 策略 | 操作 |
|------|------|------|
| L1 | 降低强度 | `beatify_type` 1 → 0 重试 |
| L2 | 检查图片质量 | 提示用户更换更清晰、人脸更大的照片 |
| L3 | 检查图片格式 | 确认为 JPG/PNG/WEBP，非 GIF/BMP 等不支持格式 |
| L4 | 停止报错 | 连续 2 次失败 → 报告 code + hint，停止重试 |

### Deliver

直接使用 Preflight 解析的 output_dir。

`mv {file} {output_dir}/{date}_beauty_{original_name}.{ext}`

命名示例：`2026-03-23_beauty_portrait.jpg`

## Output

| 项目 | 规格 |
|------|------|
| 格式 | 与原图一致（通常 JPG） |
| 数量 | 单张 |
| 命名 | `{date}_beauty_{original_name}.{ext}` |
| 位置 | 由 Deliver 步骤解析 |
