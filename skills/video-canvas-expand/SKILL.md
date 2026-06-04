---
name: video-canvas-expand
description: "使用 meitu-cli 做视频画布向外 outpainting 扩展，AI 根据 prompt 智能补全扩展区域。当用户提到扩展视频、视频扩图、画面往左右上下扩、视频 outpainting、给视频补画面、扩出更多背景、让视频画面更宽时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
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
        - ./output/
    - type: exec
      commands:
        - meitu
---

# Video Canvas Expand

## Overview

将视频画面按方向向外 outpainting 扩展，AI 根据 `prompt` 智能补全扩展区域。支持左/右/上/下任意组合方向，每条边扩展 0~0.5 倍原边长。时长不变，仅画面变宽/变高。

不处理：视频内容编辑（替换画面内容）、视频时长延长、视频裁剪/缩小、图片扩展。

## API Mapping

| 场景 | API name | workflow |
|---|---|---|
| 视频画布扩展（outpainting） | `video_canvas_expand` | `aigc_vace_outpainting_flow` |

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> **路径别名：** `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` 与 `meitu auth verify --json`
2. 检测 `MEITU_OPENAPI_TOOL_TASK_MODE=command`
3. output_dir：项目 → `./output/`；一次性 → `$VISUAL/output/video-canvas-expand/`；`mkdir -p`

### Execute

**触发信号与路由**

| 用户原话 | 路由 |
|---|---|
| 扩展视频 / 视频扩图 / outpainting / 往某方向扩 / 补画面 | `video_canvas_expand` |

决策顺序：
1. `video_url` 缺失 → 追问；`prompt` 缺失 → 追问"扩展区域补什么"
2. `directions` 不传默认四方向全扩；`expand_ratio` 不传默认 `0.3`
3. 唯一路由：调用 `video_canvas_expand`

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | — | — | 原视频 URL |
| `prompt` | STRING | 是 | — | — | 扩展区域补什么（如"补蓝天"、"扩展街景"）|
| `expand_ratio` | STRING | 否 | 0 ~ 0.5 | `"0.3"` | 每条边扩展比例 |
| `directions` | STRING | 否 | left/right/up/down 组合（逗号分隔）| `"left,right,up,down"` | 扩展方向 |

**工具调用**

```bash
meitu video-canvas-expand \
  --skill_name skill_video-canvas-expand \
  --video_url {url} \
  --prompt "{扩展内容描述}" \
  [--expand_ratio 0.3] \
  [--directions "left,right,up,down"] \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供需要扩展的视频" |
| `video_url` 不可访问 | 不重试，提示"请提供有效视频链接" |
| `prompt` 缺失 | 提示"请描述扩展区域想补全的内容（如'补蓝天'）" |
| `expand_ratio` 越界（<0 或 >0.5）| 截断至 [0, 0.5] 或提示调整 |
| `directions` 非法值 | 回退至默认四方向 |
| API 调用失败 / 超时 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 用户说"改成 16:9"但意图是裁剪 | 本工具仅扩展不裁剪，告知差异 |
| 输入为图片 | 拒绝，仅支持视频 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_canvas-expand.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_canvas-expand.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-canvas-expand/`

## 基线 Task ID

`t_mt1a3i5n7b66e66f5e-5e15-40b7-bf78-412a9490540b`
