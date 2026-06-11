---
name: video-lowlight-enhance
description: "使用 meitu-cli 做视频暗部增强/夜景提亮/低照度修复。当用户提到视频太暗、夜景提亮、暗光增强、暗部看不清、晚上拍得太暗、低照度修复时触发。"
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

# Video Lowlight Enhance

## Overview

调用 `meitu video-lowlight-enhance` 做视频暗部细节恢复、暗光环境提亮、高光阴影平衡调整。仅适用于暗光/低照度环境拍摄的视频；正常光照视频调用可能过曝。

不处理：综合画质修复、超分辨率、视频去噪、图片暗部增强、视频调色/色彩优化。

## API Mapping

| DAG 工具 | 后端 API |
|---|---|
| video-lowlight-enhance | `video_lowlight_enhance` |

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

1. `meitu --version` ≥ 2.0.6；未装走 `npm install -g meitu-cli@latest`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. 确认已跑过 Config Phase（`meitu tools update`）；`MEITU_OPENAPI_TOOL_TASK_MODE=command`
4. output_dir 解析：openclaw.yaml → `./output/` | else → `$VISUAL/output/video-lowlight-enhance/`；`mkdir -p {output_dir}`

### Execute

**触发信号/路由**

命中信号词："视频太暗、夜景、提亮、暗部、暗光、低照度、晚上拍得太暗、黑乎乎、光线不足"。

单 API 工具，参数齐全即调用 `video_lowlight_enhance`。不做跨工具兜底。

示例：
- "这个视频太黑了，看不清" → 直接调用
- "晚上拍的视频太暗了" → 直接调用
- "视频亮一点" → 轻确认"夜景暗部提亮还是普通画质修复？"

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | -- | -- | 视频地址；缺失 → "请提供需要暗部增强的视频链接" |

不需要 `prompt`。仅适用于暗光/低照度视频；光照正常视频调用会导致过曝。

**工具调用**

```bash
meitu video-lowlight-enhance --video_url {video_url} --json --download-dir {output_dir} --skill_name skill_video-lowlight-enhance
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供需要暗部增强的视频链接" |
| `video_url` 不可访问 | 不重试，提示"请提供有效视频链接" |
| 视频光照正常但用户说"提亮" | 正常调用，但提示"该视频光照正常，增强后可能过曝" |
| `video_lowlight_enhance` 调用失败 | 重试 1 次，仍失败返回错误 |
| 超时 | 重试 1 次，仍超时返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 输入为图片 | 拒绝，本工具仅处理视频 |
| 用户说"视频调色" | 告知非本工具范畴 |

### Deliver

解析 `--json` 输出：
- `ok: true` → `downloaded_files[0].saved_path` 为本地已下载结果；或取 `media_urls[0]`
- `ok: false` → 检查 `code` 和 `hint`

`mv {file} {output_dir}/{YYYY-MM-DD}_{name}_lowlight.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_lowlight.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-lowlight-enhance/`

## 基线 Task ID

```
t_mt1a3i5n7b30763966-8e69-4c6d-8a0f-384fe6206447
```

