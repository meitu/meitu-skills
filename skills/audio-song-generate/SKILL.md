---
name: audio-song-generate
description: "歌词驱动的完整歌曲生成（含人声），也支持强节奏成品级纯音乐。仅当用户明确要求生成歌曲/音频成品，并提供或同意补充风格与歌词参数时触发；普通音乐讨论、歌词创作、闲聊式演唱请求不触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"dataFlow":"Inputs, selected local context, and generated prompts may be sent to Meitu OpenAPI when used by the workflow.","credentials":"Credentials are used only for CLI authentication and must not be disclosed."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "Song style prompts and lyrics are sent to Meitu OpenAPI for audio generation."
  persistence: "Generated MP3 files are written to the resolved output directory."
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

# Audio Song Generate

## Overview

歌词驱动的完整歌曲生成（含人声，主歌/桥段/合唱完整结构），多风格创作（流行/古风/电子/摇滚等）。也支持强节奏 / 完整编曲感的纯音乐，编曲能力优于通用纯音乐工具。

## API Mapping

- 歌曲与强节奏纯音乐生成：`audio_cashew_songgenerate`

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/audio-song-generate/`

### Execute

**触发信号 / 路由规则**

核心维度：**人声/编曲场景命中 + 参数齐全**。

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 含人声的完整歌曲 | 写首歌、带人声、带歌词、唱一首、品牌歌曲 | `audio_cashew_songgenerate` |
| 强节奏 / 完整编曲的纯音乐 | 强节奏、强变化、反转旋律、完整编曲感 | `audio_cashew_songgenerate` |

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误；不做跨工具兜底。风格与歌词矛盾时以 `prompt`（风格）为准。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|------|------|------|------|------|------|
| `prompt` | STRING | 是 | -- | -- | 歌曲风格描述。缺失 → 提示"请描述你想要的歌曲风格" |
| `prompt_lyrics` | STRING | 是 | -- | -- | 歌词内容。缺失 → 提示"请提供歌词内容"（强节奏纯音乐场景可填空字符串或风格化描述） |
| `model` | STRING | 否 | auto / mureka-6 / mureka-7.5 / mureka-o1 | auto | 生成模型选择，非法值回退 auto |

`audio_cashew_songgenerate` 使用 `prompt + prompt_lyrics + model`。人声质量受多语言发音影响。

**工具调用**

```bash
meitu audio-song-generate --prompt "<style>" --prompt_lyrics "<lyrics>" [--model auto] --json   --skill_name skill_audio-song-generate
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `prompt` 缺失 | 提示"请描述你想要的歌曲风格"，不调用 API |
| `prompt_lyrics` 缺失（含人声场景） | 提示"请提供歌词内容"，不调用 API |
| `model` 指定了不存在的值 | 回退 `auto` |
| `audio_cashew_songgenerate` 调用失败 | 重试 1 次，仍失败返回错误 |
| `prompt` 与 `prompt_lyrics` 风格矛盾 | 以 `prompt` 为准，告知用户歌词将按指定风格编曲 |
| 用户只要歌词不要旋律 | 拒绝，不属于本工具范围 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_audio-song-generate.mp3`

## Output

- **格式**：MP3
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/audio-song-generate/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

