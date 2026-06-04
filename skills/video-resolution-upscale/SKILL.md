---
name: video-resolution-upscale
description: "使用 meitu-cli 做视频专项分辨率超分（720P/1080P/2K/4K），仅像素级重建不修复画质。当用户说放大到 4K、转成 1080P、超分、升清、提升分辨率时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/"],"write":["~/.openclaw/workspace/visual/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
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
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
    - type: exec
      commands:
        - meitu
---

# Video Resolution Upscale

## Overview

调用 `meitu video-resolution-upscale` 做专项视频分辨率超分（720P/1080P/2K/4K）。**仅做像素级分辨率重建**，不修复画质、不去模糊、不降噪、不补帧、不调色、不调亮度，保持原画面风格不变。

不处理：综合画质修复（无任何分辨率信号）、补帧/流畅度、视频去噪、视频夜景增强、图片超分。

## API Mapping

| DAG 工具 | 后端 API |
|---|---|
| video-resolution-upscale | `video_superres_enhance` |

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
3. output_dir 解析：openclaw.yaml → `./output/` | else → `$VISUAL/output/video-resolution-upscale/`；`mkdir -p {output_dir}`

### Execute

**触发信号/路由（两层判定）**

- 第一层（进入流程）：含"分辨率 / 超分 / 放大 / 升清 / 720P / 1080P / 2K / 4K"任一信号
- 第二层（直接调用 vs 追问）：已明确目标值 → 直接调用；未明确（"分辨率太低"/"放大点"）→ 追问

决策顺序：
1. 含分辨率相关诉求？否 → 本工具不处理（能力范围外，引导 `video-quality-enhance`）
2. 目标分辨率明确性：无具体值 → 提示"请指定目标分辨率：720P / 1080P / 2K / 4K"
3. `video_url` 缺失 → 追问
4. 目标分辨率必须高于原视频
5. 唯一路由 → `video_superres_enhance`

示例：
- "把视频提升到 4K" → `target_resolution=4K`
- "模糊老视频修复成 4K" → `target_resolution=4K`（含分辨率诉求，本工具承接）
- "帮我修复一下这个视频" → 本工具不处理（无分辨率诉求）

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | -- | -- | 视频地址；缺失 → "请提供视频链接" |
| `target_resolution` | STRING | **是** | 720p / 1080p / 2K / 4K | -- | **必须由用户显式给出，无默认值**；高于原视频分辨率 |

**无 `target_resolution` 时不可调用本工具**。

**工具调用**

```bash
meitu video-resolution-upscale \
  --skill_name skill_video-resolution-upscale \
  --video_url {video_url} \
  --target_resolution {720p|1080p|2K|4K} \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供视频链接" |
| `video_url` 不可访问 | 不重试，提示"请提供有效视频链接" |
| `target_resolution` 缺失但有分辨率诉求 | 提示"请指定目标分辨率：720P/1080P/2K/4K" |
| `target_resolution` 缺失且无任何分辨率诉求 | 本工具不处理，返回能力范围外 |
| 目标分辨率 ≤ 原视频 | 不调用，提示"目标分辨率需高于原视频" |
| `target_resolution` 非法值 | 提示"仅支持 720P/1080P/2K/4K" |
| 调用失败 | 重试 1 次，仍失败返回错误 |
| 超时 | 降低目标分辨率重试 1 次，仍超时返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 输入为图片 | 拒绝，本工具仅处理视频 |

### Deliver

解析 `--json` → `downloaded_files[0].saved_path` 或 `media_urls[0]`。超高分辨率（4K）处理时间较长。

`mv {file} {output_dir}/{YYYY-MM-DD}_{name}_{target_resolution}.mp4`

## Output

- **格式**：MP4（目标 720p/1080p/2K/4K）
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_{target_resolution}.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-resolution-upscale/`

## 基线 Task ID

```
t_mt1a3i5n7b6aae04c9-f602-468d-920f-3cc73501c44c
```
