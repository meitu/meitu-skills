---
name: video-content-replace
description: "使用 meitu-cli 替换视频中的内容元素（人物/场景/服装/衣物），保留原始运镜和动作，支持文本指令和参考图驱动。当用户提到视频替换、改视频内容、把视频里的 xx 改成、把视频背景换成、用这张图替换视频里的人、参考图替换时触发。"
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

# Video Content Replace

## Overview

对**已有视频**做内容元素替换（人物/场景/服装/衣物/穿着），保留原始运镜和动作，覆盖 2 类场景：

1. **文本指令替换**：文本指令驱动视频内容修改，无需额外参考图。
2. **参考图驱动替换**：用户提供参考图 + 视频，按参考图替换视频中对应元素。

不处理：视频生成、去水印/去字幕、整体风格变换、音频修改、视频拼接。

## API Mapping

| 场景 | API name | model |
|---|---|---|
| 文本指令替换 | `video_molasses_edit` | `molasses` |
| 参考图驱动替换 | `video_molasses_vidimgs2vid` | `molasses` |

`model` 可选：`auto`（默认，按是否有参考图自动路由）/ `molasses`（显式指定）。

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
3. output_dir：项目 → `./output/`；一次性 → `$VISUAL/output/video-content-replace/`；`mkdir -p`

### Execute

**触发信号与路由**

核心判断维度：**是否提供参考图**。

| 场景 | 判定 | 路由 |
|---|---|---|
| 有参考图 + 替换元素 | 有 `image_url` | `video_molasses_vidimgs2vid` |
| 无参考图 + 文本指令 | 无 `image_url` | `video_molasses_edit`（默认） |

路由原则：`image_url` 存在时优先走参考图模式，即使用户说"用文字描述修改"也走 `vidimgs2vid`。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 是 | 见下方约束 | — | 原视频地址 |
| `prompt` | STRING | 是 | — | — | 修改描述 |
| `image_url` | STRING | 否 | — | — | 参考图 URL；存在时路由至 `vidimgs2vid` |
| `model` | STRING | 否 | `auto`/`molasses` | `auto` | 模型选择 |

其余参数（`duration`/`ratio`/`character_orientation` 等）由 combo-tool 内部管理，不对外暴露。

**`video_url` 约束（参考图驱动模式专用）**：

- 格式：`.mp4` / `.mov`；大小：≤ 100MB
- 边长：340px ~ 3850px；时长：3 ~ 30 秒
- 画面：漏出清晰的上半身/全身，1 人动作，一镜到底，动作平稳

`video_molasses_edit`（文本指令模式）对 `video_url` 限制较宽松，主要是格式和大小。

**工具调用**

```bash
# 文本指令
meitu video-content-replace --video_url {url} --prompt "{修改描述}" --json --download-dir {output_dir} --skill_name skill_video-content-replace
```

```bash
# 参考图驱动
meitu video-content-replace --video_url {url} --prompt "{修改描述}" --image_url {ref} --json --download-dir {output_dir} --skill_name skill_video-content-replace
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供视频链接"，不调用 |
| `video_url` 不可访问 | 直接返回错误，不重试 |
| `prompt` 缺失 | 提示"请描述你想修改的内容" |
| `image_url` 不可访问 | 降级至 `video_molasses_edit`（仅用 prompt） |
| `video_url` 非 mp4/mov | 提示格式要求，不调用 |
| `video_url` >100MB 或边长越界 | 提示具体超限项 |
| `video_url` 时长 <3s / >30s（vidimgs2vid）| 提示时长要求 |
| 返回 "Video duration can not longer than" | **识别为参考视频时长超限（非生成时长）**，提示用户裁剪视频而非重试 |
| API 调用失败 / 超时 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_content-replace.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_content-replace.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-content-replace/`

## 基线 Task ID

`t_mt1a3i5n7b82954cc9-d2cb-44cd-a786-cb9fd37244f9`

