---
name: video-element-remove
description: "使用 meitu-cli 从视频中消除路人/字幕/水印/Logo 或一键清屏全部文字。当用户提到去路人、去行人、去字幕、去对白、去水印、去 Logo、去角标、消除抖音号、清屏、纯净画面、不要出现任何字时触发。"
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

# Video Element Remove

## Overview

对**已有视频**做元素消除，覆盖 4 类场景（仅此 4 类，不处理鞋子/垃圾/随机物体等任意对象）：

1. **去路人 / 行人**：消除背景路人、行人，基于内容检测自动处理。
2. **去字幕（随时间变化）**：消除随时间变化的字幕条带（对白、中文字幕、底部文字）。
3. **去水印 / Logo / 角标（固定位置）**：消除固定位置的水印、Logo、平台角标、抖音号。
4. **一键清屏**：一次性清除画面中所有文字（字幕 + 水印 + UI 文字）。

不处理：添加 Logo/水印、视频内容替换、图片去水印、视频画质增强。

## API Mapping

| 场景 | API name |
|---|---|
| 去路人 / 行人 | `video_content_remove` |
| 去字幕（随时间变化的对白条带） | `video_subtitle_remove` |
| 去水印 / Logo / 角标（固定位置） | `video_watermark_remove` |
| 一键清屏（去全部文字） | `video_allwords_remove` |

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
3. output_dir：项目 → `./output/`；一次性 → `$VISUAL/output/video-element-remove/`；`mkdir -p`

### Execute

**触发信号与路由**

核心判断维度：**消除目标类型**。Agent 调用前先识别视频画面内容，生成 `prompt` 描述（如"视频右上角有平台水印，底部有中文字幕"）。

`prompt` → 路由映射：

| `prompt` 信号词 | 路由 API |
|---|---|
| 路人 / 行人 / 背景里的人 | `video_content_remove` |
| 字幕 / 台词 / 对白 / 底部文字 | `video_subtitle_remove` |
| 水印 / Logo / 角标 / 平台标 / 固定位置标识 | `video_watermark_remove` |
| 所有文字 / 全部字 / 清屏 / 全部清除 | `video_allwords_remove` |
| 字幕 + 水印 同时去 | `video_subtitle_remove` + `video_watermark_remove` 并行调用 |

**场景互斥边界**

- "去所有字"（全部文字）→ `video_allwords_remove`；"去字幕"（仅字幕）→ `video_subtitle_remove`
- 固定位 Logo → `video_watermark_remove`；随时间字幕 → `video_subtitle_remove`
- `subtitle_remove` + `watermark_remove` **可并行**；`allwords_remove` 与其他互斥（清屏已包含）

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | — | — | 视频地址 |
| `prompt` | STRING | 是 | — | — | Agent 对视频画面的描述，工具据此判断消除类型 |

说明：
- 识别不到任何信号词时默认走 `video_subtitle_remove`（最常见消除诉求）
- 清屏需二次确认（会去除所有文字）

**工具调用**

```bash
meitu video-element-remove --video_url {url} --prompt "{画面描述}" --json --download-dir {output_dir} --skill_name skill_video-element-remove
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供视频链接"，不调用 |
| `video_url` 不可访问 | 直接返回错误，不重试 |
| `prompt` 为空或无信号词 | Agent 识别视频画面生成描述后重新判断 |
| 意图模糊（"去字"） | 按画面识别：仅字幕→subtitle；字幕+水印+UI→allwords；仅固定 Logo→watermark |
| 用户要"去字幕+去全部文字" | 互斥，默认走 `video_allwords_remove` |
| API 调用失败 / 超时 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_element-remove.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_element-remove.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-element-remove/`

## 基线 Task ID

`t_mt1a3i5n7b339aa95a-03dd-4f3e-9d31-786dc86b33aa`
