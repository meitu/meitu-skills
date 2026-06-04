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

- **meitu-cli**: `npm install -g meitu-cli@latest`
- **凭证**: `meitu config set-ak --value "..."` / `meitu config set-sk --value "..."`, 或 env vars `MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`

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

**prompt 路由**

服务端按 `--prompt` 中的主体描述自动路由到合适算法（标准四类主体走 `api_v1_sod_async` 输出透明底 PNG；非标准主体或用户要求白底走 `image_praline_edit_v2` 输出白底图）。

| 用户意图 / 图片内容 | 推荐 prompt | 输出 |
|---------------------|------------|------|
| 人像、证件照、半身照 | `"person"` / `"portrait"` | 透明底 PNG，保留发丝细节 |
| 商品、产品、电商图 | `"product"` / `"sneakers"` 等具体品类 | 透明底 PNG，产品边缘优化 |
| 设计素材、图标、印章 | `"graphic stamp"` / `"icon"` | 透明底 PNG |
| 建筑、植物、车辆、食物 | `"building"` / `"car"` 等具体描述 | 白底 RGB(255,255,255) |
| 用户明确要求白底 | 在 prompt 里加 `"white background"` | 白底 |
| 不确定 / 未说明 | `"subject"` 或由 Agent 判断后填入 | 默认走标准抠图（透明底） |

规则：Agent 先识别图片主体并生成 prompt，具体品类词比泛化的 `subject` 更精准。用户明确要白底时，在 prompt 里加 `white background` 即可。

**工具调用**

单张抠图：
```bash
meitu image-cutout --image_url {image_url_or_path} --prompt "{subject_description}" --json --download-dir {output_dir} --skill_name skill_meitu-cutout
```

**批量处理**

用户提供多张图片时，逐张调用：
```bash
for img in {image_list}; do
  meitu image-cutout --image_url "$img" --prompt "{subject_description}" --json --download-dir {output_dir} --skill_name skill_meitu-cutout
done
```

注意：`image-cutout` 每次只处理一张图，不支持 `--image_list`；输入参数只接 `--image_url`（别名 `--image`）。

**结果检查**

解析 `--json` 输出：
- `ok: true` → 成功，`downloaded_files[0].saved_path` 为本地已下载的结果 PNG（透明背景）；若未使用 `--download-dir`，则取 `media_urls[0]`
- `ok: false` → 检查 `code` 和 `hint`

**错误降级**

| 级别 | 动作 | 说明 |
|------|------|------|
| L1 | 调整 prompt | 自动检测不准时，将 prompt 改为更具体的主体描述（如 `"running shoe"` 替代 `"product"`），或追加 `"white background"` 强制白底 |
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
