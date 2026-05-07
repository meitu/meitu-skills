---
name: meitu-short-video-studio
description: "把主题、卖点或关键视觉快速编排成短视频成片。支持脚本/分镜生成、单段视频生成、补配乐或旁白、以及多段拼接。当用户提到短视频、广告片、reels、shorts、产品视频、种草视频、promo video、teaser video 时触发。"
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

# Meitu Short Video Studio

## Overview

面向 2026 高频短视频场景的编排型 Skill。它不要求用户先懂命令，而是从一个主题、卖点、口播方向或首帧参考图出发，自动串联：

`text-generate` -> `text-to-video` / `image-to-video` -> `video-audio-add` -> `video-stitch`

适合：
- 产品种草视频
- 广告短片 / teaser
- Reel / Shorts / 小红书视频封面延展
- 口播脚本驱动的视频样片

不处理：
- 复杂视频剪辑
- 动作迁移舞蹈视频（转 `meitu-video-dance`）
- 纯音乐 MV（优先转 `meitu-music-video`）

## Dependencies

- `meitu-cli`（建议 `>=2.0.6`）
- 凭证：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
- 可选项目上下文：`~/.openclaw/workspace/visual/`

## Core Workflow

```text
Preflight -> Plan -> Generate Clips -> Audio Polish -> Stitch -> Deliver
```

### Preflight

1. `meitu --version`
2. `meitu auth verify --json`
3. 解析 `output_dir`：
   - 项目模式：`./output/`
   - 一次性模式：`~/.openclaw/workspace/visual/output/meitu-short-video-studio/`
4. 判断用户素材类型：
   - 只有主题/卖点 -> 文本驱动
   - 有首帧/海报/产品图 -> 图驱动
   - 已有多段视频 -> 以拼接收束

### Input Slots

| 槽位 | 必填 | 说明 |
|------|------|------|
| `topic` | 是 | 视频主题、卖点或故事方向 |
| `target_platform` | 否 | 如 小红书 / 抖音 / Reels |
| `duration_goal` | 否 | 总时长目标，默认 8-15 秒 |
| `image_list` | 否 | 首帧、产品图、KV、封面图 |
| `tone` | 否 | 轻快、治愈、高级感、极简等 |
| `audio_need` | 否 | 无音频 / BGM / 旁白 / BGM+旁白 |

### Plan

如果用户没有现成脚本，先调用：

```bash
meitu text-generate \
  --summary "{topic}，输出 2-3 段短视频分镜与口播要点" \
  --language "简体中文" \
  --json
```

输出要求：
- 每段 1 个镜头目标
- 每段 1 句核心文案
- 每段 1 个画面提示词

若用户已经给了完整脚本或镜头要求，跳过此步。

### Generate Clips

#### 路由规则

| 条件 | 调用 |
|------|------|
| 只有主题/文案 | `text-to-video` |
| 有封面图 / 首帧图 / 商品图 | `image-to-video` |
| 已有 2 段以上视频 | 跳过生成，直接进入 Stitch |

#### 单段视频模板

文生视频：

```bash
meitu text-to-video \
  --prompt "{shot_prompt}" \
  --video_duration 4 \
  --aspect_ratio 9:16 \
  --json --download-dir {output_dir}
```

图生视频：

```bash
meitu image-to-video \
  --image_list "{image_url}" \
  --prompt "{shot_prompt}" \
  --json --download-dir {output_dir}
```

建议默认生成 1-3 段，不要一次拆太多镜头。

### Audio Polish

| 用户需求 | 调用 |
|---------|------|
| 加 BGM | `video-audio-add` |
| 加旁白 | `video-audio-add` |
| 都不要 | 跳过 |

示例：

```bash
meitu video-audio-add \
  --video_list "{clip_url}" \
  --prompt "轻快、年轻、适合产品种草短视频的背景音乐" \
  --json --download-dir {output_dir}
```

### Stitch

当有多段视频时，调用：

```bash
meitu video-stitch \
  --video_list "{clip1}" "{clip2}" \
  --prompt "短视频成片，节奏紧凑" \
  --json --download-dir {output_dir}
```

### Error Fallback

| 场景 | 降级策略 |
|------|---------|
| `topic` 缺失 | 追问用户要讲什么产品/主题 |
| `text-to-video` 超时或失败 | 缩短到 3-5 秒，或切成更少镜头 |
| `image-to-video` 失败 | 改用 `text-to-video` 只保留画面描述 |
| 音频添加失败 | 先交付无音频版本 |
| 拼接失败 | 改为交付单段最佳版本 |

### Deliver

输出内容：
- 1 条短视频成片，或 1-3 条可选样片
- 可选：分镜脚本摘要
- 文件命名：`{YYYY-MM-DD}_{topic}_short-video.mp4`

## Trigger Hints

以下表达优先触发本 Skill：
- 帮我做个短视频
- 做个产品宣传片
- 给这个卖点生成 reels
- 做个 teaser video
- 从这个封面图延展一段视频
- 把这段文案变成短视频
