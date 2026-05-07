---
name: meitu-music-video
description: "把音乐或 BGM 编排成带氛围视觉的短片。支持先生成纯音乐、再做多模态视频，最后可拼成更完整的音乐短片。当用户提到 music video、BGM 视频、music visualizer、氛围 MV、音频驱动短片时触发。"
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

# Meitu Music Video

## Overview

面向热门的 BGM 视频、mood film、music visualizer 场景。它可以从“先有音乐”或“先有氛围描述”两种入口开始，最终编排出一条音画统一的短片。

默认编排链路：

`audio-music-generate` / `audio-song-generate` -> `video-multimodal-generate` -> `video-stitch` / `video-to-gif`

适合：
- 无歌词 BGM 氛围短片
- 歌曲驱动的简短音乐视频
- 情绪板 / mood film
- 社媒音乐可视化内容

不处理：
- 纯文生视频广告片（优先转 `meitu-short-video-studio`）
- 复杂真人 MV 剪辑

## Input Slots

| 槽位 | 必填 | 说明 |
|------|------|------|
| `music_prompt` | 否 | 想要的音乐风格、情绪、场景 |
| `audio_url` | 否 | 已有音频 URL |
| `visual_prompt` | 是 | 视觉氛围描述 |
| `image_list` | 否 | 封面图、参考图、角色图 |
| `reference_video_list` | 否 | 参考运镜/节奏视频 |
| `duration_goal` | 否 | 默认智能时长 |

### Routing Rules

| 条件 | 处理 |
|------|------|
| 已有 `audio_url` | 跳过音频生成 |
| 没有音频，但要无人声氛围 | `audio-music-generate` |
| 明确要歌曲感 / 完整 vocal | `audio-song-generate` |

## Core Workflow

```text
Preflight -> Build Audio -> Build Visual -> Optional Stitch -> Deliver
```

### Build Audio

纯 BGM：

```bash
meitu audio-music-generate \
  --prompt "{music_prompt}" \
  --duration 30 \
  --json
```

如果用户已给音频链接，直接将该音频作为后续 `reference_audio_list` 输入。

### Build Visual

使用音频 + 图片 / 视频 / 文本生成多模态视频：

```bash
meitu video-multimodal-generate \
  --prompt "{visual_prompt}" \
  --video_duration -1 \
  --ratio 9:16 \
  --image_list "{optional_image}" \
  --reference_audio_list "{audio_url}" \
  --json --download-dir {output_dir}
```

如果用户同时给了参考视频节奏，也可补：
- `--reference_video_list "{video_url}"`

### Optional Stitch

当用户想要多段氛围变化或要首尾拼起来时，调用：

```bash
meitu video-stitch \
  --video_list "{clip1}" "{clip2}" \
  --prompt "music video with cohesive rhythm" \
  --json --download-dir {output_dir}
```

如果只是要传播用动图，可改走 `video-to-gif` 作为交付分支。

### Error Fallback

| 场景 | 降级策略 |
|------|---------|
| 没有 `audio_url` 且没有 `music_prompt` | 追问音乐风格 |
| 音乐生成失败 | 让用户直接上传现有音频 |
| 多模态视频失败 | 减少素材数量，仅保留音频 + 1 张图 |
| 多模态仍失败 | 改成纯 `text-to-video` 视觉样片并说明未绑定音频 |
| 拼接失败 | 交付单段最佳版本 |

## Deliverables

建议默认交付：
- 1 条主视频
- 可选 1 条 GIF 预览
- 可选生成的 BGM 文件

命名建议：
- `{YYYY-MM-DD}_{theme}_music-video.mp4`
- `{YYYY-MM-DD}_{theme}_music-preview.gif`

## Trigger Hints

以下表达优先触发本 Skill：
- 给这段 BGM 做个视频
- 做个 music visualizer
- 做一条氛围 MV
- 用这个音频配一段视觉
- 先生成一段音乐，再配成视频
