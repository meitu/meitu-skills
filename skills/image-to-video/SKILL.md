---
name: image-to-video
description: "以图片驱动生成动态视频，覆盖单图生成、多图参考融合（1–9 图）、首尾帧过渡（1–2 图）。当用户提到图生视频、图片变视频、让图片动起来、照片活化、多图融合、首尾帧、过渡视频、从 A 到 B、把这张图变成视频时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
requirements:
  credentials:
    - name: MEITU_OPENAPI_ACCESS_KEY
      source: env | ~/.meitu/credentials.json
    - name: MEITU_OPENAPI_SECRET_KEY
      source: env | ~/.meitu/credentials.json
  env:
    MEITU_OPENAPI_TOOL_TASK_MODE: command
  permissions:
    - type: file_read
      paths:
        - ~/.meitu/credentials.json
        - ~/.meitu/tool-registry.json
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

# Image to Video

## Overview

以图片为驱动生成动态视频。3 类场景：单图生成视频（支持音频/比例/分辨率，默认 toffee 失败兜底 bonbon）、多图参考融合（1–9 图）、首尾帧过渡（1–2 图）。时长 4–15s。

## API Mapping

- 单图默认：`video_toffee_i2v_v20`
- 单图兜底：`video_bonbon_img2vid_v30`（支持智能分镜/多镜头，不支持 aspect_ratio）
- 多图参考融合（1–9 图）：`video_toffee_mi2v_v20`
- 首尾帧过渡（1–2 图）：`video_toffee_flf_v20`
- mode 映射：`auto`（默认）/`i2v`/`mi2v`/`flf`
- model 映射：`auto`（默认）/`toffee`/`bonbon`
- mode 与 model 同时指定且冲突时，**mode 优先**

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 实际执行（见根 `CONFIG.md`）
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> 路径别名：`$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6
2. 已用 CONFIG AKSK 跑过 `meitu tools update`
3. 当前 AKSK = EXEC，`MEITU_OPENAPI_TOOL_TASK_MODE=command`
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-to-video/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

核心维度：**mode（优先） → 图片数量 + 意图**。

| 条件 | 图片数 | 路由 |
|---|---|---|
| `mode=i2v` | 任意 | `video_toffee_i2v_v20` → 失败兜底 `video_bonbon_img2vid_v30` |
| `mode=mi2v` | 任意 | `video_toffee_mi2v_v20` |
| `mode=flf` | 任意 | `video_toffee_flf_v20` |
| `mode=auto`，1 张，"参考元素/角色/风格" | 1 | `video_toffee_mi2v_v20` |
| `mode=auto`，1 张，其他（默认） | 1 | `video_toffee_i2v_v20` → 兜底 `video_bonbon_img2vid_v30` |
| `mode=auto`，2 张，未说融合（默认） | 2 | `video_toffee_flf_v20` |
| `mode=auto`，2 张，说了融合/参考 | 2 | `video_toffee_mi2v_v20` |
| `mode=auto`，3–9 张 | 3–9 | `video_toffee_mi2v_v20` |

**参数定义（统一工具层）**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|------|------|------|------|------|------|
| `image_list` | ARRAY[STRING] | 是 | 1–9 张 | -- | 输入图片 URL 列表 |
| `prompt` | STRING | 是 | -- | -- | 视频内容描述 |
| `mode` | STRING | 否 | auto / i2v / mi2v / flf | auto | 路由模式；与 model 冲突时 mode 优先 |
| `model` | STRING | 否 | auto / toffee / bonbon | auto | 底层模型 |
| `aspect_ratio` | STRING | 否 | adaptive/1:1/3:4/4:3/9:16/16:9/21:9 | adaptive | 画面比例（i2v/mi2v/flf 支持；bonbon 不支持） |
| `video_duration` | NUMBER | 否 | 4–15 | 5 | 时长（秒）。bonbon 默认 5；i2v/mi2v/flf 内部默认 10 |
| `sound` | STRING | 否 | off / on | off | 是否生成音频 |
| `multi_shot` | BOOLEAN | 否 | true/false | true | 多镜头切换（仅 bonbon 生效） |

其余参数（`shot_type`/`resolution`/`reference_video_list`/`reference_audio_list` 等）由 combo-tool 内部管理，不对外暴露。

API 映射关键点：

- `video_toffee_i2v_v20`：`sound`→`generate_audio`（on→true/off→false BOOL），`aspect_ratio`→`ratio`，`resolution` 内部默认 720p
- `video_bonbon_img2vid_v30`：`image_list[0]`→`image_url`，`sound` 直传 STRING，`aspect_ratio` 不支持降级时静默丢弃
- `video_toffee_mi2v_v20`：`image_list` 直传（≤9），`sound`→`generate_audio` BOOL
- `video_toffee_flf_v20`：`image_list` 1–2 张（[0]=首帧，[1]=尾帧可选）

**工具调用**

```bash
meitu image-to-video --image_list <img1>[,<img2>,...] --prompt "<desc>" [--mode auto] [--video_duration 5] [--sound off] [--aspect_ratio adaptive] --json --download-dir {output_dir} --skill_name skill_image-to-video
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `mode` 非法 | 回退 `auto` |
| `model` 非法 | 回退 `auto` |
| `mode=flf` 但图片数 >2 | 提示"首尾帧模式最多 2 张图片，当前 {n} 张" |
| `prompt` 缺失 | 提示"请描述你想生成的视频内容" |
| 无图片输入 | 拒绝，能力范围外 |
| 图片数 >9 | 拒绝，能力范围外 |
| 时长 <4s | 钳位到 4s 并告知 |
| 时长 >15s | 钳位 15s |
| 智能分镜 + i2v/mi2v/flf | 静默忽略分镜参数 |
| `video_toffee_i2v_v20` 调用失败 | 降级到 `video_bonbon_img2vid_v30`（`aspect_ratio` 丢弃，`image_list[0]`→`image_url`） |
| 任一 API 调用失败（含兜底） | 同一 API 重试 1 次 → 仍失败返回错误 |
| 超时（>600s） | 降低时长/尺寸重试 1 次 → 仍失败返回错误 |
| 部分图片不可访问 | 过滤不可访问，用剩余图片重新匹配子能力 |
| 全部图片不可访问 | 返回错误 |
| mode + model 冲突 | mode 优先 |
| `mode=i2v` + 多图 | 取 `image_list[0]`，忽略多余图片 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 从 `downloaded_files[0].saved_path` 读取已下载的视频文件路径
- `mv {downloaded_files[0].saved_path} {output_dir}/{YYYY-MM-DD}_{descriptive}_image-to-video.mp4`

## Output

- **格式**：MP4
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-to-video/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

