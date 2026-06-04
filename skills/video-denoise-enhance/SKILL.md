---
name: video-denoise-enhance
description: "使用 meitu-cli 去除视频颗粒感/色块/运动噪声，保留细节同时降噪。当用户提到视频去噪、降噪、去颗粒、减少噪点、噪点太多、颗粒感重、杂色、ISO 太高时触发。"
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

# Video Denoise Enhance

## Overview

去除视频颗粒感 / 色块 / 运动噪声，保留细节同时降噪。覆盖高感光拍摄降噪、暗光拍摄噪点消除、老视频颗粒修复、游戏/运动视频色块修复。噪点越严重效果越明显；非噪点问题（模糊、欠曝、分辨率低）使用本工具无效。

不处理：综合画质修复、视频超分、夜景暗部提亮、图片去噪、补帧 / 流畅度。

## API Mapping

| 场景 | API name |
|---|---|
| 视频去噪 | `video_denoise_enhance` |

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
3. output_dir：项目 → `./output/`；一次性 → `$VISUAL/output/video-denoise-enhance/`；`mkdir -p`

### Execute

**触发信号与路由**

| 用户原话 | 路由 |
|---|---|
| 去噪 / 降噪 / 去颗粒 / 噪点太多 / 杂色 / ISO 太高 | `video_denoise_enhance` |
| "视频干净一点"（意图模糊） | 轻确认"是去噪点，还是做整体画质修复？" |

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误，不做跨工具兜底。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | — | — | 视频地址 |

说明：本工具仅使用 `video_url`，不需要 `prompt`。

**工具调用**

```bash
meitu video-denoise-enhance --video_url {url} --json --download-dir {output_dir} --skill_name skill_video-denoise-enhance
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供视频链接" |
| `video_url` 不可访问 | 不重试，提示"请提供有效视频链接" |
| 视频噪点不明显但用户坚持 | 正常调用，告知效果可能不明显 |
| API 调用失败 / 超时 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 输入为图片 | 拒绝，仅支持视频 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_denoise.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_denoise.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-denoise-enhance/`

## 基线 Task ID

`t_mt1a3i5n7b96af8209-02f2-41b3-9038-6f5a44e83f31`
