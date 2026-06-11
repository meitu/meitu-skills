---
name: meitu-upscale
description: "将模糊或低分辨率图片提升至高清（超分辨率）。支持人像、商品、截图、文字图等多种图片类型。当用户提到超清、变清晰、高清、提升分辨率、图片模糊、放大图片、upscale、super resolution 时触发。"
version: "1.1.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY"],"paths":{"read":["~/.meitu/credentials.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
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
        - ./openclaw.yaml
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
        - ./output/
    - type: exec
      commands:
        - meitu
---

# Meitu Upscale

## Overview

一键图片超分辨率：提升分辨率、增强清晰度、降噪去压缩伪影。调用 `meitu image-superres-enhance`，通过内容描述让 CLI 自动选择最优超清路径。

## Dependencies

- **meitu-cli** ≥ 2.0.6 — `npm install -g meitu-cli@latest`
- **凭证配置**: 首选环境变量 `MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`，或预置 `~/.meitu/credentials.json`；仅在用户明确要求写入本地凭证时，再执行 `meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`。

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context: 跳过（工具型超分，无创意自由度）] → Execute → Deliver
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli@latest`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-upscale/`
   `mkdir -p {output_dir}`

### Execute

**输入获取**

用户提供图片，接受以下形式：
- 本地文件路径 → 使用 `--image_url <url_or_path>`
- 图片 URL → 使用 `--image_url <url_or_path>`
- 对话中直接发送的图片 → 保存到临时文件后使用 `--image_url <url_or_path>`

若用户未提供图片，主动询问："请提供需要超清的图片（文件路径或 URL）。"

**内容描述选择**

根据图片主体内容构造 `--prompt`，让 `image-superres-enhance` 选择合适的超清路径：

| 主体类型 | `--prompt` 示例 | 判断依据 |
|---------|------------------|---------|
| 人像为主 | `portrait photo` | 人脸是视觉焦点（证件照、自拍、人物特写） |
| 商品/物品 | `e-commerce product image` | 产品、食物、实物特写、商业摄影 |
| 图形/截图 | `text document or UI screenshot` | UI 截图、文字图片、插画、图标、设计稿 |
| 不确定 | `general image` | 无法明确归类时的默认描述 |

选择策略：
- 用户明确说了主体类型 → 按上表选择对应描述
- 用户未说明 → 用 Read 工具读取图片，目视判断主体类型
- 无法判断（如 URL 无法预览）→ 使用 `general image`

**调用命令**

```bash
meitu image-superres-enhance \
  --skill_name skill_meitu-upscale \
  --image_url <url_or_path> \
  --prompt "<content_description>" \
  --json \
  --download-dir {output_dir}
```

> **注意**: 该命令面向清晰度提升与目标分辨率增强，不支持旧版 `model_type`。如果用户强调 2x/4x/8x 的等比几何放大，应改走 `image-transform`。

**结果处理**

- `ok: true` → `downloaded_files[0].saved_path` 获取本地文件路径，进入 Deliver
- `ok: false` → 进入错误降级

**错误降级**

| 级别 | 策略 | 操作 |
|------|------|------|
| L1 | 简化内容描述 | `text document or UI screenshot` / `e-commerce product image` 等专门描述失败时，回退为 `general image` |
| L2 | 检查图片格式/内容 | 确认为 JPG/PNG/WEBP，非 GIF/BMP/SVG 等不支持格式。`INVALID_RESOURCES` (10025) 也可能是内容审核拒绝 → 告知用户"图片未通过内容审核，请更换图片" |
| L3 | 检查图片来源 | URL 不可达 → 下载到 `/tmp/meitu-upscale-input.{ext}` 后用本地路径重试 |
| L4 | 凭证/余额问题 | `ORDER_REQUIRED` → 提示充值，展示 action_url |
| L5 | 停止报错 | 连续 2 次失败 → 报告 code + hint，停止重试 |

临时文件完成后清理：`rm -f /tmp/meitu-upscale-input.*`

### Deliver

直接使用 Preflight 解析的 output_dir。

`mv {path} {output_dir}/{date}_upscale.{ext}`

> **扩展名**: `{ext}` 从 `downloaded_files[0].saved_path` 的实际扩展名取（服务端可能返回 `.jpeg` 而非 `.jpg`），统一转为 `.jpg`（即 `.jpeg` → `.jpg`）。

命名示例：`2026-03-23_upscale.jpg`、`2026-03-23_upscale_portrait.png`

## Output

| 项目 | 规格 |
|------|------|
| 格式 | 与原图一致（JPG→JPG, PNG→PNG, WEBP→WEBP） |
| 数量 | 单张 |
| 命名 | `{date}_upscale[_{context}].{ext}` |
| 位置 | 由 Deliver 步骤解析 |

## Boundaries

本 skill 只做**超分辨率**——提升分辨率和清晰度，不改变画面内容。

| 不做 | 转交 |
|------|------|
| 美颜磨皮 | `meitu-beauty` |
| 去水印/去路人/内容修复 | `meitu-image-fix` |
| 风格转换 | `meitu-stylize` |
| 去背景 | `meitu-cutout` |
| 综合修图（模糊+水印+美颜） | `meitu-image-fix`（会在管线中自动调用 upscale） |

