---
name: video-logo-add
description: "使用 meitu-cli 给视频四角叠加 Logo/水印图片，支持透明底 PNG。当用户提到加水印、加 Logo、打 Logo、贴标、加角标、合成水印、叠加 Logo、视频贴牌、品牌标识时触发。"
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

# Video Logo Add

## Overview

为视频四角定位叠加 Logo / 水印图片，支持透明底 PNG。覆盖品牌 Logo 叠加、视频水印添加、角标贴图、版权标识。`position` 仅支持四角定位（top-left / top-right / bottom-left / bottom-right），不支持自由坐标。

不处理：自由定位、去除水印、纯文字水印、图片加水印、视频内容替换。

## API Mapping

| 场景 | API name |
|---|---|
| 视频 Logo / 水印叠加 | `video_logo_add` |

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
3. output_dir：项目 → `./output/`；一次性 → `$VISUAL/output/video-logo-add/`；`mkdir -p`

### Execute

**触发信号与路由**

| 用户原话 | 路由 |
|---|---|
| 加水印 / 加 Logo / 打 Logo / 贴标 / 加角标 / 叠加 Logo | `video_logo_add` |

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | — | — | 原视频 URL |
| `logo_url` | STRING | 是 | — | — | Logo / 水印图片 URL，推荐透明底 PNG |
| `position` | STRING | 否 | top-left / top-right / bottom-left / bottom-right | `top-right` | 叠加位置（仅四角）|

**工具调用**

```bash
meitu video-logo-add \
  --skill_name skill_video-logo-add \
  --video_url {url} \
  --logo_url {logo} \
  [--position top-right] \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供需要加 Logo 的视频" |
| `logo_url` 缺失 | 提示"请发送您要添加的水印图片" |
| `video_url` 不可访问 | 不重试，提示"请提供有效视频链接" |
| `logo_url` 不可访问 | 不重试，提示"请提供有效的 Logo 图片链接" |
| 用户说"加文字水印"无图片 | 告知需图片形式 Logo，建议先将文字制作为 PNG |
| 用户指定"居中"等非四角位置 | 告知仅支持四角定位 |
| API 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 输入为图片 | 拒绝，仅处理视频 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_logo-add.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_logo-add.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-logo-add/`

## 基线 Task ID

`t_mt1a3i5n7b5ab3eb03-6bd9-46a1-a939-f1729fb73f56`
