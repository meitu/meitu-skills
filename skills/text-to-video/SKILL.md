---
name: text-to-video
description: "使用 meitu-cli 从纯文字描述生成动态视频，覆盖高画质默认模式与高动态快速模式。当用户提到文生视频、文字生成视频、帮我生成一段视频、做一个视频、广告视频、产品宣传片、短视频时触发。"
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

# Text To Video（文生视频）

## Overview

纯文字驱动生成动态视频，涵盖 2 类场景：

1. **高画质默认模式**：创意视频、广告素材、文案可视化、概念演示；4–15s，比例 adaptive/16:9/4:3/1:1/3:4/9:16/21:9，480p/720p，音频默认 on。
2. **高动态快速模式**：追求动态效果 / 画面生动、或需 3s 短时长；3–15s，仅 16:9/1:1/9:16，720p，音频默认 off，动态效果更强。

不处理：图片驱动生成视频、音频驱动生成、视频编辑、视频加特效/改风格。

## API Mapping

| 场景 | 后端 API |
|------|---------|
| 高画质默认模式 | `video_toffee_t2v_v20` |
| 高动态快速模式 | `video_bonbon_txt2vid_v30` |

model 映射：

- `auto`（默认）/ 不传 → 按路由规则决策
- `toffee` → `video_toffee_t2v_v20`
- `bonbon` → `video_bonbon_txt2vid_v30`
- 互相降级：一方失败切另一方重试

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令（见根 `CONFIG.md`）
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6
2. `meitu auth verify --json`
3. 确认 registry 含 `text-to-video`
4. 解析 output_dir：`openclaw.yaml` → `./output/`；else → `~/.openclaw/workspace/visual/output/text-to-video/`
5. 时长钳位：用户要 <3s → 钳位 3s 并告知

### Execute

**触发信号 / 路由规则**

决策顺序：
1. 时长 <3s → 钳位 3s
2. 动态优先 / 3s 短时长 命中 → 候选 `video_bonbon_txt2vid_v30`
3. 若比例为 4:3/3:4/21:9/adaptive → 比例优先，切回 `video_toffee_t2v_v20`
4. 无特殊要求 → `video_toffee_t2v_v20`（默认）

| 场景 | 判定关键词 | 路由 |
|------|-----------|------|
| 动态优先 | 动态、生动 | `video_bonbon_txt2vid_v30` |
| 3s 短时长 | 3 秒 | `video_bonbon_txt2vid_v30` |
| 默认 / 无特殊要求 | 通用 | `video_toffee_t2v_v20` |
| 特殊比例（4:3/3:4/21:9/adaptive） | -- | 强制 `video_toffee_t2v_v20`（比例优先）|
| 要 480p | -- | `video_toffee_t2v_v20`（bonbon 不支持 480p）|

**参数定义**

通用参数：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `prompt` | STRING | 是 | -- | -- | 视频内容描述。缺失 → 追问 |
| `video_duration` | NUMBER | 是 | 3–15 | 按 API 不同 | toffee: 4–15，默认 10；bonbon: 3–15，默认 5 |
| `sound` | STRING / BOOL | 是 | on/off 或 true/false | 按 API 不同 | toffee: BOOL `generate_audio`，默认 true；bonbon: STRING on/off，默认 off |
| `aspect_ratio` | STRING | 是 | adaptive / 16:9 / 1:1 / 9:16 / 4:3 / 3:4 / 21:9 | 按 API 不同 | toffee 全比例支持，默认 adaptive；bonbon 仅 16:9/1:1/9:16，默认 16:9 |
| `resolution` | STRING | 否 | 480p / 720p | 720p | 仅 toffee 支持；bonbon 固定 720p |

各 API 参数映射：

**`video_toffee_t2v_v20`（高画质默认）**

| 统一参数 | API 参数 | 映射规则 |
|---|---|---|
| `prompt` | `prompt` | 直传 |
| `video_duration` | `video_duration` | clamp(4, 15)，默认 10 |
| `sound` | `generate_audio` | on→true / off→false；默认 true |
| `aspect_ratio` | `ratio` | 全比例直传，默认 adaptive |
| `resolution` | `resolution` | 480p/720p，默认 720p |

**`video_bonbon_txt2vid_v30`（高动态快速）**

| 统一参数 | API 参数 | 映射规则 |
|---|---|---|
| `prompt` | `prompt` | 直传 |
| `video_duration` | `video_duration` | clamp(3, 15)，默认 5 |
| `sound` | `sound` | on/off 直传，默认 off |
| `aspect_ratio` | `aspect_ratio` | 支持 16:9/1:1/9:16；其他比例切 toffee |

**工具调用**

默认高画质：
```bash
meitu text-to-video \
  --prompt "{video_description}" \
  --video_duration 10 \
  --aspect_ratio adaptive \
  --resolution 720p \
  --sound true \
  --json --download-dir {output_dir}
```

高动态快速（3s）：
```bash
meitu text-to-video \
  --prompt "{dynamic_scene}" \
  --model bonbon \
  --video_duration 3 \
  --aspect_ratio 16:9 \
  --sound off \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理方式 |
|------|---------|
| `prompt` 缺失 | 提示"请描述你想生成的视频内容" |
| 时长 <3s | 钳位 3s，告知"文生视频最短支持 3 秒" |
| 时长 <4s + 默认模式 | toffee 最短 4s → 降级 `video_bonbon_txt2vid_v30` |
| 特殊比例 + 快速模式 | bonbon 仅 16:9/1:1/9:16 → 切 `video_toffee_t2v_v20`，告知"当前比例不支持动态模式，已切换默认模式" |
| 未指定时长 + 默认模式 | 默认 10s |
| 未指定时长 + 快速模式 | 默认 5s |
| `video_toffee_t2v_v20` 失败 | 切 `video_bonbon_txt2vid_v30` 重试 |
| `video_bonbon_txt2vid_v30` 失败 | 切 `video_toffee_t2v_v20` 重试 → 仍失败返回错误 |
| 超时 >600s | 降低时长 / 分辨率重试 1 次 → 仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |

冲突规则：
- 动态 + 特殊比例 → 比例优先，走 `video_toffee_t2v_v20`
- 3s 时长 + 默认模式 → 时长优先，走 `video_bonbon_txt2vid_v30`
- 要 480p → 走 `video_toffee_t2v_v20`（bonbon 不支持）

### Deliver

解析 `--json`：
- `ok: true` → `downloaded_files[0].saved_path` 为本地视频
- `ok: false` → 输出 `code` + `hint`

落盘：`mv {file} {output_dir}/{YYYY-MM-DD}_{descriptive-name}.mp4`

## Output

- **格式**: MP4
- **命名**: `{YYYY-MM-DD}_{descriptive-name}.mp4`
- **位置**: 项目 → `./output/`；一次性 → `~/.openclaw/workspace/visual/output/text-to-video/`

## 基线 Task ID

见根目录 `references/task-id-baseline.md` 中 `text-to-video` 条目。
