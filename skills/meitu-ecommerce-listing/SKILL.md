---
name: meitu-ecommerce-listing
description: "从商品图快速编排出上新所需的电商素材包。支持白底主图、场景图、卖点海报和可选超清增强。当用户提到上新图、主图、卖点图、listing pack、hero image、ecommerce launch assets 时触发。"
version: "1.0.0"
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

# Meitu E-commerce Listing

## Overview

把一张商品图扩成一套更接近真实上新流程的电商素材，而不是只生成单张图。默认编排链路：

`image-cutout` -> `image-background-replace` / `image-edit` -> `image-superres-enhance` -> `image-poster-generate`

适合：
- 电商主图 / Hero image
- 白底图 + 场景图
- 卖点图 / 活动首屏
- SKU 上新视觉包

不处理：
- 多角度三视图（优先转 `meitu-product-view`）
- 单纯替换产品主体（优先转 `meitu-product-swap`）

## Dependencies

- `meitu-cli`（建议 `>=2.0.6`）
- 凭证：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
- 可选项目上下文：`~/.openclaw/workspace/visual/`

## Core Workflow

```text
Preflight -> Product Audit -> Hero Image -> Scene Variant -> Selling-point Poster -> Deliver
```

### Preflight

1. `meitu --version`
2. `meitu auth verify --json`
3. 解析 `output_dir`
4. 检查是否已有：
   - 商品图
   - 品类信息
   - 目标平台
   - 卖点文案

### Input Slots

| 槽位 | 必填 | 说明 |
|------|------|------|
| `image_url` | 是 | 商品主图 |
| `product_name` | 否 | 商品名称，用于命名与海报文案 |
| `platform` | 否 | 淘宝 / 京东 / 亚马逊 / 小红书店铺等 |
| `selling_points` | 否 | 1-3 条卖点 |
| `style_goal` | 否 | 白底、极简、生活方式、科技感等 |
| `need_upscale` | 否 | 是否需要更高清输出 |

### Product Audit

先判断原图背景是否干净。

| 条件 | 处理 |
|------|------|
| 原图背景复杂，且要白底/场景图 | 先 `image-cutout` |
| 原图已干净 | 跳过抠图 |

示例：

```bash
meitu image-cutout \
  --image_url "{image_url}" \
  --prompt "e-commerce product foreground subject" \
  --json
```

### Hero Image

如果用户需要白底主图，优先走：

```bash
meitu image-background-replace \
  --image_url "{source_image}" \
  --prompt "clean pure white studio background for e-commerce hero image" \
  --json
```

如果用户要更强的商业感或有复杂场景要求，可以走：

```bash
meitu image-edit \
  --image_list "{source_image}" \
  --prompt "premium studio hero shot, centered product, clean commercial lighting" \
  --model praline_pro \
  --ratio 1:1 \
  --json
```

### Scene Variant

针对生活方式、氛围场景或节日场景，优先做 1 张场景主图：

```bash
meitu image-background-replace \
  --image_url "{source_image}" \
  --prompt "{scene_description}" \
  --json
```

默认只出 1 个场景版本，避免一次编排太长。

### Selling-point Poster

如果用户提供了卖点文案，收束成卖点海报：

```bash
meitu image-poster-generate \
  --prompt "{product_name} + {selling_point} + e-commerce poster layout" \
  --image_list "{scene_or_hero_image}" \
  --ratio 4:5 \
  --model Praline_2 \
  --json
```

### Upscale

当用户指定更高清、或目标平台偏高分辨率时，对关键出图执行：

```bash
meitu image-superres-enhance \
  --image_url "{hero_or_scene_image}" \
  --prompt "e-commerce product image" \
  --json
```

### Error Fallback

| 场景 | 降级策略 |
|------|---------|
| 没有商品图 | 追问并暂停 |
| 抠图失败 | 直接用原图继续 |
| 白底换背景失败 | 回退到 `image-edit` 的简化商业图 |
| 卖点海报失败 | 交付 Hero 图 + Scene 图，不阻塞整体流程 |
| 超分失败 | 交付原分辨率版本 |

## Recommended Deliverables

默认交付 2-4 张：
- 白底主图
- 场景图
- 卖点海报
- 可选超清版本

命名建议：
- `{YYYY-MM-DD}_{product_name}_hero.png`
- `{YYYY-MM-DD}_{product_name}_scene.png`
- `{YYYY-MM-DD}_{product_name}_selling-point.png`

## Trigger Hints

以下表达优先触发本 Skill：
- 给这个商品做一套上新图
- 我要主图加卖点图
- 做个 listing pack
- 出一张白底图再出一张场景图
- 生成电商首图和详情首屏
