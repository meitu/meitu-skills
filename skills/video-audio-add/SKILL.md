---
name: video-audio-add
description: "使用 meitu-cli 给已有视频加音频：加 BGM、加旁白配音、或 BGM+旁白串联。当用户提到加背景音乐、配 BGM、换背景音乐、加旁白、加配音、配个解说、加画外音、配音配乐、视频加音频时触发。"
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

# Video Audio Add

## Overview

为**已有视频**添加音频轨道，覆盖 2 类场景并可串联：

1. **添加背景音乐（BGM）**：工具内部根据 `prompt` 描述检索素材库匹配音乐，或使用自定义 `audio_url`；`video_volume` 默认 `1`（不压低原声）。
2. **添加旁白配音**：工具内部根据 `prompt` 中音色描述检索音色素材；`video_volume` 默认 `0`（压低原声突出旁白）。

BGM + 旁白需同时添加时，串联执行 `video_bgm_add` → `video_narration_add`。

不处理：视频拼接、拼接+配乐一体化、纯音乐/歌曲生成、视频内容/画面编辑。

## API Mapping

| 场景 | API name |
|---|---|
| 添加背景音乐 | `video_bgm_add` |
| 添加旁白配音 | `video_narration_add` |

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` → 未安装则提示安装
2. `meitu auth verify --json` → 凭证无效则引导配置
3. 检测 `MEITU_OPENAPI_TOOL_TASK_MODE=command` 是否设置
4. 解析 output_dir：项目模式 → `./output/`；一次性 → `$VISUAL/output/video-audio-add/`；`mkdir -p`

### Execute

**触发信号与路由**

| 用户原话 | 路由 |
|---|---|
| 加 BGM / 配个背景音乐 / 换背景音乐（无 `audio_url`） | `video_bgm_add`（内部根据 `prompt` 检索素材）|
| "用这段音频做配乐"（有 `audio_url`） | `video_bgm_add`（跳过内部检索，直接用 `audio_url`）|
| 加旁白 / 加配音 / 配解说 / 加画外音 | `video_narration_add`，`prompt` 含旁白文案 + 音色偏好 |
| 配音配乐 / 加 BGM 和旁白 | 串联：先 `video_bgm_add` → 再 `video_narration_add` |

**参数定义**

通用参数：

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_list` | ARRAY[STRING] | 是 | — | — | 视频地址列表 |
| `prompt` | STRING | 是 | — | — | BGM：音乐风格偏好；旁白：旁白文案 + 音色 |

`video_bgm_add` 额外：

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `audio_url` | STRING | 否 | — | — | 自定义音频 URL；存在时跳过内部素材检索 |
| `music_volume` | NUMBER | 否 | 0–1 | 1 | 背景音乐音量 |
| `video_volume` | NUMBER | 否 | 0–1 | 1 | 原声音量（默认不压低）|

`video_narration_add` 额外：

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_volume` | NUMBER | 否 | 0–1 | 0 | 原声音量（默认压低）|

说明：`bgm_material_id` / `voice_material_id` **不作为外部入参**，由工具内部根据 `prompt` 自动检索；无匹配则使用默认素材/音色。

**工具调用**

```bash
# BGM
meitu video-audio-add --video_list {urls} --prompt "{风格}" [--audio_url {url}] [--music_volume 1] [--video_volume 1] --json --download-dir {output_dir} --skill_name skill_video-audio-add
```

```bash
# 旁白
meitu video-audio-add --video_list {urls} --prompt "{旁白文案 + 音色}" [--video_volume 0] --json --download-dir {output_dir} --skill_name skill_video-audio-add

# 串联：BGM → 旁白（第一步失败则停止串联）
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_list` 缺失 | 提示"请提供视频链接"，不调用 |
| `video_list` 中任一不可访问 | 直接返回错误，不重试 |
| 旁白场景 `prompt` 缺失 | 提示"请提供配音文案" |
| `audio_url` 不可访问（BGM） | 回退至内部检索默认音乐 |
| 工具内部检索无匹配 | 使用默认素材/音色继续 |
| 串联第一步失败 | 停止串联，返回错误 |
| API 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_audio-add.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_audio-add.mp4`
- **位置**：项目模式 → `./output/`；一次性 → `$VISUAL/output/video-audio-add/`

## 基线 Task ID

`t_mt1a3i5n7b55cdc12e-cdeb-46fd-a95d-28a7546bf033`
