---
name: meitu-social-campaign
description: "把一个 campaign idea 扩成适配多个平台的社媒素材包。支持 campaign 文案、海报主视觉、不同尺寸延展和平台化改版。当用户提到 social campaign、campaign assets、多平台素材包、小红书封面套图、Douyin assets 时触发。"
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

# Meitu Social Campaign

## Overview

这个 Skill 解决的是“一个 idea，要发多个平台”的问题。它会把同一个 campaign 主题拆成：

`text-generate` -> `image-poster-generate` -> `image-transform` / `image-edit`

适合：
- 小红书封面 + 内页首图
- 抖音 / Reels 封面图
- 微信公众号首图
- 一套 campaign 视觉的多尺寸延展

不处理：
- 完整轮播图长链路（优先转 `meitu-carousel`）
- 深度海报创意推导（优先转 `meitu-poster`）

## Dependencies

- `meitu-cli`（建议 `>=2.0.6`）
- 凭证：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`

## Core Workflow

```text
Preflight -> Campaign Copy -> Master Poster -> Platform Variants -> Deliver
```

### Input Slots

| 槽位 | 必填 | 说明 |
|------|------|------|
| `campaign_topic` | 是 | 活动主题、产品主题或传播主题 |
| `platforms` | 否 | 如 小红书 / 抖音 / 公众号 / IG |
| `brand_tone` | 否 | 年轻、治愈、科技、高端等 |
| `cta` | 否 | 活动口号、主按钮文案、卖点短句 |
| `image_list` | 否 | 参考图、主 KV、品牌物料 |

### Campaign Copy

当用户没有现成文案时，先生成短文案钩子：

```bash
meitu text-generate \
  --summary "{campaign_topic}，输出主标题、短副标题、3 条社媒钩子文案" \
  --language "简体中文" \
  --json
```

### Master Poster

生成一张主视觉海报，作为所有平台延展的母版：

```bash
meitu image-poster-generate \
  --prompt "{campaign_topic} + {brand_tone} + 主视觉海报" \
  --image_list "{optional_ref}" \
  --ratio 3:4 \
  --model Praline_2 \
  --json
```

### Platform Variants

优先产出 2-3 个平台版本，不要一次扩太多。

| 平台 | 建议比例 | 默认处理 |
|------|---------|---------|
| 小红书封面 | `3:4` | 直接复用主海报或轻改文案 |
| 抖音封面 / Reels | `9:16` | `image-transform` 先扩图，必要时再 `image-edit` |
| 公众号封面 | `16:9` | 优先做横版延展 |
| 通用方图 | `1:1` | 适合信息流和头像位展示 |

扩图示例：

```bash
meitu image-transform \
  --image_url "{master_image}" \
  --width 1080 \
  --height 1920 \
  --json
```

如果扩图后还需要重排版，再补一轮：

```bash
meitu image-edit \
  --image_list "{variant_image}" \
  --prompt "rebalance layout for {platform} campaign cover, keep same theme and visual tone" \
  --model praline_pro \
  --ratio 9:16 \
  --json
```

### Error Fallback

| 场景 | 降级策略 |
|------|---------|
| 无主题输入 | 追问 campaign 核心主题 |
| 文案生成失败 | 让用户直接给一句标题 |
| 海报生成失败 | 改为更短 prompt 或移除参考图 |
| 平台延展失败 | 只交付主海报 + 1 个成功变体 |
| 比例不合适 | 回退到最接近的平台比例 |

## Deliverables

建议默认交付：
- 1 张 master poster
- 2 张平台变体
- 3 条 campaign hook 文案

命名建议：
- `{YYYY-MM-DD}_{campaign}_master.png`
- `{YYYY-MM-DD}_{campaign}_xiaohongshu.png`
- `{YYYY-MM-DD}_{campaign}_douyin.png`

## Trigger Hints

以下表达优先触发本 Skill：
- 给我做一套 social campaign 物料
- 同一个主题出小红书和抖音版本
- 做 campaign assets
- 这个活动需要多平台封面图
- 给我一张主视觉再出几个尺寸版本
