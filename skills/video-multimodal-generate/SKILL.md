---
name: video-multimodal-generate
description: "使用 meitu-cli 做多模态混合驱动生成视频（音频/视频/图片/文字任意组合）。当用户说配合音乐生成、参考视频运镜/风格/节奏、音频驱动视频、多素材混合生成时触发。"
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

# Video Multimodal Generate

## Overview

调用 `meitu video-multimodal-generate` 基于音频/视频/图片/文字任意组合做多模态混合驱动视频生成。适合音乐配视频、参考视频运镜/节奏、多素材混合生成。

不处理：纯文字生成视频、仅图片生成视频（无视频无音频）、动作迁移。

## API Mapping

| DAG 工具 | 后端 API |
|---|---|
| video-multimodal-generate | `video_multimodal_generate` |

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> 路径别名：`$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6；`meitu auth verify --json`
2. 确认已跑过 Config Phase；`MEITU_OPENAPI_TOOL_TASK_MODE=command`
3. output_dir 解析：openclaw.yaml → `./output/` | else → `$VISUAL/output/video-multimodal-generate/`；`mkdir -p {output_dir}`

### Execute

**触发信号/路由**

触发条件（任一成立）：
- 用户上传音频 → 必须走本工具（独有能力）
- 仅视频无图片 → 运镜/风格/节奏参考
- 用户想参考视频的运镜/风格/节奏（不是模仿人体动作）
- 复杂多素材混合（图片+视频+音频）

决策顺序：
1. 至少一类多媒体素材；`prompt` 缺失 → 追问
2. 素材总数 ≤12（图片+视频+音频合计）
3. 唯一路由 → `video_multimodal_generate`

有图+视频但意图不明（运镜 vs 动作模仿）→ 默认走本工具。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `prompt` | STRING | 是 | -- | -- | 文字描述；缺失 → "请描述你想生成的视频内容" |
| `video_duration` | NUMBER | 是 | 4–15 / -1（智能） | -1 | 视频时长（秒） |
| `ratio` | STRING | 是 | adaptive/16:9/4:3/1:1/3:4/9:16/21:9 | adaptive | 画面比例 |
| `image_list` | ARRAY | 否 | ≤9 张 | -- | 图片 URL 列表 |
| `reference_video_list` | ARRAY | 否 | ≤3 个，总时长 ≤15s | -- | 参考视频 URL 列表 |
| `reference_audio_list` | ARRAY | 否 | ≤3 个，总时长 ≤15s | -- | 音频 URL 列表 |
| `sound` | BOOL | 否 | true / false | true | 是否生成音频 |
| `resolution` | STRING | 否 | 480p / 720p | 720p | 视频分辨率 |

至少提供一类多媒体素材；图片+视频+音频合计 ≤12。

**工具调用**

```bash
meitu video-multimodal-generate \
  --skill_name skill_video-multimodal-generate \
  --prompt "{prompt}" \
  --video_duration -1 \
  --ratio adaptive \
  --image_list '["{url1}"]' \
  --reference_video_list '["{video_url}"]' \
  --reference_audio_list '["{audio_url}"]' \
  --sound true --resolution 720p \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `prompt` 缺失但有素材 | 提示"请描述你想生成的视频内容" |
| 素材总数 >12 | 提示输入限制，建议精简素材 |
| `video_duration` 与音频时长冲突 | 优先匹配音频时长，告知用户 |
| 部分素材不可访问 | 静默过滤，按剩余素材继续执行 |
| 调用失败 | 降级模型版本重试 1 次 → 仍失败返回错误 |
| 超时 | 降低 duration / size 重试 1 次 → 仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 无任何多媒体素材 | 不属于本工具范畴 |

### Deliver

解析 `--json` → `downloaded_files[0].saved_path` 或 `media_urls[0]`。

`mv {file} {output_dir}/{YYYY-MM-DD}_{name}_multimodal.mp4`

## Output

- **格式**：MP4（默认 720p，可选 480p）
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_multimodal.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-multimodal-generate/`

## 基线 Task ID

```
t_mt1a3i5n7bd3dd7a38-c263-48f7-ac18-bb8573c364b2
```

