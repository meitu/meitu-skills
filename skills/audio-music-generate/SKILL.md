---
name: audio-music-generate
description: "生成无人声、无歌词的纯音乐 / BGM，适合背景音乐、氛围铺垫、情绪渲染，时长 30–120 秒。当用户提到 BGM、背景音乐、纯音乐、无人声、情绪音乐、氛围音乐、轻音乐、伴奏、器乐、钢琴曲、电子乐、爵士、Vlog 配乐时触发。"
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

# Audio Music Generate

## Overview

纯音乐/BGM 生成（无人声、无歌词），支持多种风格（爵士/古典/电子/钢琴/氛围等）和时长精确控制（30–120 秒）。偏氛围/铺垫/背景类纯音乐，不负责强节奏强变化或完整歌曲结构。

## API Mapping

- 纯音乐/BGM 生成：`audio_peanut_generate`

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/audio-music-generate/`

### Execute

**触发信号 / 路由规则**

核心维度：**纯音乐场景命中 + 参数齐全**。

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 纯音乐 / BGM / 背景音乐 | BGM、纯音乐、无人声、氛围、伴奏、器乐 | `audio_peanut_generate` |

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误；不做跨工具兜底。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|------|------|------|------|------|------|
| `prompt` | STRING | 是 | -- | -- | 纯音乐描述（主题/风格/场景/情绪）。缺失 → 提示"请描述你想要的音乐风格或场景" |
| `duration` | NUMBER | 是 | 30–120 | 30 | 生成时长（秒）。超出范围自动钳位至 30–120，并告知用户 |

`prompt` 由 Agent 整理为结构化的风格/场景/情绪描述。

**工具调用**

```bash
meitu audio-music-generate --prompt "<style/scene/mood>" [--duration 30] --json   --skill_name skill_audio-music-generate
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `prompt` 缺失 | 提示"请描述你想要的音乐风格或场景"，不调用 API |
| `duration` 超出 30–120 | 自动钳位，告知用户 |
| 用户要求 >120s | 告知最长 120s，钳位 |
| `audio_peanut_generate` 调用失败 | 重试 1 次，仍失败返回错误 |
| 风格描述模糊 | 提示补充风格/场景/情绪偏好 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_audio-music-generate.mp3`

## Output

- **格式**：MP3
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/audio-music-generate/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
