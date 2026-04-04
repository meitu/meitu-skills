---
name: meitu-cutout
description: "使用 meitu-cli 抠图，分离前景主体并生成透明背景图片。当用户提到抠图、去背景、透明背景、背景移除、cutout、remove background、提取主体时触发。"
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

# Meitu Cutout

## Overview

调用 `meitu image-cutout` 从图片中分离前景主体，输出透明背景 PNG。支持人像、商品、图形三种模式，可自动检测。

## Dependencies

- **meitu-cli**: `npm install -g meitu-cli`
- **凭证**: `meitu config set-ak --value "..."` / `meitu config set-sk --value "..."`, 或 env vars `MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context: 跳过（工具型抠图，无创意自由度）] → Execute → Deliver
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-cutout/`
   `mkdir -p {output_dir}`

### Execute

**输入解析**

用户提供图片，支持两种形式：
- 本地文件路径（如 `./photo.jpg`）
- 图片 URL（如 `https://example.com/photo.jpg`）

如果用户只说"帮我抠图"但没给图片 → 问："请提供需要抠图的图片（本地路径或 URL）"。

**model_type 路由**

| 用户意图 / 图片内容 | model_type | 说明 |
|---------------------|-----------|------|
| 人像、证件照、半身照 | `0` (portrait) | 人像优化，保留发丝细节 |
| 商品、产品、电商图 | `1` (product) | 产品边缘优化 |
| 设计素材、图标、插画 | `2` (graphic) | 图形/非照片类 |
| 不确定 / 未说明 | 不传 | 自动检测（推荐默认） |

规则：用户未指定类型时，不传 `--model_type`，让服务端自动检测。仅当用户明确说"这是人像/商品/图标"或图片来源明确（如"电商主图"）时才指定。

**工具调用**

单张抠图：
```bash
meitu image-cutout --image {image_url_or_path} --json --download-dir {output_dir}
```

指定 model_type：
```bash
meitu image-cutout --image {image_url_or_path} --model_type {0|1|2} --json --download-dir {output_dir}
```

**批量处理**

用户提供多张图片时，逐张调用：
```bash
for img in {image_list}; do
  meitu image-cutout --image "$img" --json --download-dir {output_dir}
done
```

注意：`image-cutout` 每次只处理一张图，不支持 `--image_list`。

**结果检查**

解析 `--json` 输出：
- `ok: true` → 成功，`downloaded_files[0].saved_path` 为本地已下载的结果 PNG（透明背景）；若未使用 `--download-dir`，则取 `media_urls[0]`
- `ok: false` → 检查 `code` 和 `hint`

**错误降级**

| 级别 | 动作 | 说明 |
|------|------|------|
| L1 | 切换 model_type | 自动检测失败时，依次尝试 0→1→2 |
| L2 | 检查图片格式/大小 | 确保图片可访问且非损坏 |
| L3 | 停止并报错 | 2 次连续失败后，输出 `code` + `hint` |

特殊错误：
- `ORDER_REQUIRED` → 提示用户充值，展示 `action_url`
- `CREDENTIALS_MISSING` → 提示配置 AK/SK

### Deliver

直接使用 Preflight 解析的 output_dir。

`mv {file} {output_dir}/{date}_{name}_cutout.png`

## Output

- **格式**: PNG（透明背景）
- **命名**: `{YYYY-MM-DD}_{descriptive-name}_cutout.png`
  - 例: `2026-03-23_product-photo_cutout.png`
- **位置**: 由 Deliver 步骤决定（项目 → `./output/`，一次性 → `$VISUAL/output/meitu-cutout/`）
