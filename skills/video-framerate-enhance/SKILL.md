---
name: video-framerate-enhance
description: "使用 meitu-cli 提升视频帧率/插帧（如 24fps → 60fps），让低帧率视频运动更流畅。当用户提到补帧、插帧、加帧、提帧率、升帧率、60 帧、120 帧、流畅度、帧率不够、视频卡顿时触发。"
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

# Video Framerate Enhance

## Overview

视频帧率提升 / 插帧（如 24fps → 60fps），让低帧率视频运动更流畅。覆盖老视频流畅化、游戏/运动视频补帧、慢动作效果平滑处理。视频时长不变，仅帧率提升。

不处理：综合画质修复、超分辨率、视频去噪、变速 / 改时长、剪辑 / 拼接。

## API Mapping

| 场景 | API name |
|---|---|
| 视频补帧 / 帧率提升 | `video_framerate_enhance` |

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
3. output_dir：项目 → `./output/`；一次性 → `$VISUAL/output/video-framerate-enhance/`；`mkdir -p`

### Execute

**触发信号与路由**

| 用户原话 | 路由 |
|---|---|
| 补帧 / 插帧 / 提帧率 / 60 帧 / 120 帧 / 流畅 | `video_framerate_enhance` |
| "视频更流畅一点"（意图模糊） | 轻确认"是要补帧让运动更流畅，还是做整体画质修复？" |

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | — | — | 视频地址 |
| `frame_rate` | NUMBER | 否 | 24 / 30 / 60 | 60 | 目标帧率（fps） |

说明：
- 目标帧率 ≤ 原帧率 → 不调用，直接返回原视频并告知
- 视频时长不变，仅帧率提升

**工具调用**

```bash
meitu video-framerate-enhance --video_url {url} [--frame_rate 60] --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供需要补帧的视频链接" |
| `video_url` 不可访问 | 不重试，提示"请提供有效视频链接" |
| 目标帧率 ≤ 原帧率 | 不调用，直接返回原视频并告知 |
| `frame_rate` 非法值（如 50/90） | 钳位至最近合法值（24/30/60） |
| 用户说"更流畅"未指定帧率 | 默认 `frame_rate=60` |
| API 调用失败 / 超时 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 用户说"变速 / 慢放" | 告知本工具不支持变速，仅提升帧率 |
| 输入为图片 | 拒绝，仅支持视频 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_framerate.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_framerate.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-framerate-enhance/`

## 基线 Task ID

`t_mt1a3i5n7b1f3f37c1-30d2-4aa7-8671-96215839c41f`
