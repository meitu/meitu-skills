---
name: meitu-ai-portrait
description: "把一张或几张人像扩成更完整的写真体验。支持写真主图、商务形象照、换装、换脸保持一致性，以及最后的人像精修。当用户提到 AI 写真、商务头像、形象照、portrait set、multi-look portrait 时触发。"
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

# Meitu AI Portrait

## Overview

这个 Skill 把“写真”从单张图变成一个完整的人像玩法：先出主 portrait，再按需要做换装、换背景或风格统一，最后补一轮轻修图。

默认编排链路：

`image-portrait-generate` / `text-to-image` -> `image-face-swap` / `image-outfit-swap` -> `image-edit`

适合：
- AI 写真
- 商务形象照
- 头像套系
- 多 look portrait set

不处理：
- 证件照标准规格（优先转 `meitu-id-photo`）
- 单次简单美颜（优先转 `meitu-beauty`）

## Input Slots

| 槽位 | 必填 | 说明 |
|------|------|------|
| `image_list` | 是 | 用户人像图，通常 1-2 张 |
| `portrait_goal` | 是 | 商务、时尚、复古、艺术等目标风格 |
| `background_goal` | 否 | 背景要求 |
| `outfit_goal` | 否 | 服装方向 |
| `need_face_consistency` | 否 | 是否要把同一张脸保持到多个场景 |
| `size` | 否 | 默认 `2K` |

## Core Workflow

```text
Preflight -> Portrait Base -> Optional Styling -> Final Polish -> Deliver
```

### Portrait Base

先生成一张主 portrait：

```bash
meitu image-portrait-generate \
  --image_list "{user_image}" \
  --prompt "{portrait_goal}" \
  --size 2K \
  --json
```

如果用户没有上传人像，只给了想要的风格方向，可退化为文生图 portrait 思路，但优先提示需要参考人像。

### Optional Styling

#### 换装

```bash
meitu image-outfit-swap \
  --image_url "{portrait_image}" \
  --prompt "{outfit_goal}" \
  --json
```

#### 保持同一张脸进入另一个场景

```bash
meitu image-face-swap \
  --head_image_url "{user_face}" \
  --sence_image_url "{portrait_or_scene_image}" \
  --prompt "keep identity consistent, natural portrait result" \
  --json
```

默认只做一个增强分支：
- 需要 outfit -> 优先 outfit
- 需要 identity consistency -> 优先 face swap

### Final Polish

最后用 `image-edit` 做轻微统一：

```bash
meitu image-edit \
  --image_list "{styled_portrait}" \
  --prompt "polished portrait, natural skin tone, premium studio finish" \
  --model gummy_pro \
  --json
```

### Error Fallback

| 场景 | 降级策略 |
|------|---------|
| 无人像图 | 追问上传正脸或半身图 |
| `image-portrait-generate` 失败 | 缩短 prompt，保留最核心风格描述 |
| 换装失败 | 只交付主 portrait |
| 换脸失败 | 保留原主 portrait，不再强制一致性 |
| 精修失败 | 返回未精修版本 |

## Recommended Deliverables

建议默认交付：
- 1 张主 portrait
- 1 张风格增强或换装版
- 可选 1 张商务头像裁切方向

命名建议：
- `{YYYY-MM-DD}_{portrait_goal}_portrait.png`
- `{YYYY-MM-DD}_{portrait_goal}_styled.png`

## Trigger Hints

以下表达优先触发本 Skill：
- 帮我做一套 AI 写真
- 生成商务形象照
- 做一组头像套图
- 同一张脸换几套造型
- 做个 portrait lookbook
