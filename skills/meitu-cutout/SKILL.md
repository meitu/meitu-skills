---
name: meitu-cutout
description: "使用 meitu-cli 为人物、宠物、商品、图标或印章抠图，分离前景主体并生成透明背景 PNG。当用户针对上述五类主体提到抠图、去背景、透明背景、背景移除、cutout、remove background、提取主体时触发；白底隔离和其他主体类型不支持。"
version: "1.1.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY"],"paths":{"read":["~/.meitu/credentials.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/","$VISUAL/output/meitu-cutout/","~/.openclaw/workspace/visual/output/meitu-cutout/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"outputConstraints":"output_dir must resolve only to ./output/ in project mode or $VISUAL/output/meitu-cutout/ in one-off mode; final mv targets must remain inside these declared directories."}}}
security:
  output_constraints: "output_dir must resolve only to ./output/ in project mode or $VISUAL/output/meitu-cutout/ in one-off mode; final mv targets must remain inside these declared directories."
  overwrite_policy: "Do not move or overwrite files outside the declared output directories."
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
        - $VISUAL/output/meitu-cutout/
        - ~/.openclaw/workspace/visual/output/meitu-cutout/
    - type: exec
      commands:
        - meitu
---

# Meitu Cutout

## Overview

调用 `meitu image-cutout` 从图片中分离前景主体，输出透明背景 PNG。仅支持人物、宠物、商品、图标、印章五类主体；可选人像、商品、图形三种模型，也可省略模型参数自动检测。

## Dependencies

- **meitu-cli**: `npm install -g meitu-cli@latest`
- **凭证**: 首选 env vars `MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`，或预置 `~/.meitu/credentials.json`；仅在用户明确要求写入本地凭证时，再执行 `meitu config set-ak --value "..."` / `meitu config set-sk --value "..."`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context: 跳过（工具型抠图，无创意自由度）] → Execute → Deliver
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli@latest`
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

**模型选择**

| 图片主体 | `model_type` | 输出 |
|----------|--------------|------|
| 人像、证件照、半身照 | `0` | 透明底 PNG，保留发丝细节 |
| 商品、产品、电商图 | `1` | 透明底 PNG，优化产品边缘 |
| 设计素材、图标、印章 | `2` | 透明底 PNG |
| 宠物或类型不确定 | 省略 | 服务端自动选择模型，输出透明底 PNG |

`model_type` 仅允许 `0`、`1`、`2`。建筑、植物、车辆、食物、家具等非五类主体以及白底隔离不受支持，不得通过 prompt 或替代 API 绕过限制；需要生成白底时改用 `image-edit`。

**工具调用**

单张抠图：
```bash
meitu image-cutout --image_url {image_url_or_path} --json --download-dir {output_dir} --skill_name skill_meitu-cutout
```

明确指定模型时追加 `--model_type 0`、`--model_type 1` 或 `--model_type 2`；省略时自动选型。

**批量处理**

批量处理整个目录：
```bash
meitu batch image-cutout --input-dir {input_dir} --output-dir {output_dir} --skill_name skill_meitu-cutout
```

整个批次共用固定模型时追加 `--model-type 0`、`--model-type 1` 或 `--model-type 2`。逐条指定时使用 JSON/YAML 配置，条目字段 `modelType`（兼容 `model_type`）映射到单次命令的 `model_type`。批处理默认并发数为 3，输出 `.png`。

注意：单次命令不支持 `--image_list`；输入参数只接 `--image_url`（别名 `--image`）。

**结果检查**

解析 `--json` 输出：
- `ok: true` → 成功，`downloaded_files[0].saved_path` 为本地已下载的结果 PNG（透明背景）；若未使用 `--download-dir`，则取 `media_urls[0]`
- `ok: false` → 检查 `code` 和 `hint`

**错误降级**

| 级别 | 动作 | 说明 |
|------|------|------|
| L1 | 调整模型选择 | 自动检测不准时，根据主体改用 `--model_type 0`、`1` 或 `2` |
| L2 | 检查图片格式/大小 | 确保图片可访问且非损坏 |
| L3 | 停止并报错 | 2 次连续失败后，输出 `code` + `hint` |

非五类主体或白底隔离直接返回不支持，不调用、不重试。

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
