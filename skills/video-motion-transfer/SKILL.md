---
name: video-motion-transfer
description: "使用 meitu-cli 做视频动作姿态迁移，把参考视频动作迁移到图片人物上并保留外貌。仅在用户明确提供人物图片和动作参考视频，并表达动作迁移、姿态驱动、模仿动作或让图中人物跟着视频做动作时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "User-provided person images, reference motion videos, and generated prompts are sent to Meitu OpenAPI."
  biometric_notice: "Portrait photos and motion-reference videos may reveal sensitive personal appearance or identity characteristics. Confirm the depicted person has agreed to this processing before running the workflow."
  persistence: "Generated motion-transfer videos are written to the resolved local output directory."
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

# Video Motion Transfer

## Overview

调用 `meitu video-motion-transfer` 将参考视频中的动作姿态迁移到图片人物上，保留图片人物外貌特征。用于舞蹈复刻、动作模仿、姿态驱动、虚拟人驱动。

执行前应让用户清楚知道：本 Skill 会读取 Meitu 凭证、调用本地 `meitu` CLI、将用户提供的人物图片、动作参考视频和生成提示发送到 Meitu OpenAPI 处理，并把结果写入 `./output/` 或 `$VISUAL/output/video-motion-transfer/`。涉及人像和动作素材时，应确认对素材中人物具备处理授权。

不处理：纯文字生成视频、参考视频运镜/风格、换脸/换人物、视频内容编辑。

## API Mapping

| DAG 工具 | 后端 API |
|---|---|
| video-motion-transfer | `video_motion_transfer` |

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

1. `meitu --version` ≥ 2.0.6；`meitu auth verify --json`
2. 确认已跑过 Config Phase；`MEITU_OPENAPI_TOOL_TASK_MODE=command`
3. output_dir 解析：openclaw.yaml → `./output/` | else → `$VISUAL/output/video-motion-transfer/`；`mkdir -p {output_dir}`

### Execute

**触发信号/路由**

命中条件：同时提供图片（人物参考图）+ 视频（动作参考视频），且意图为模仿动作。信号词："动作迁移、模仿动作、跟着跳舞、姿态驱动、让这个人做这个动作"。

决策顺序：
1. `image_list` / `reference_video_list` 缺失 → 追问
2. 意图判断：动作模仿 → 本工具；运镜/风格参考 → 不属于本工具
3. 唯一路由 → `video_motion_transfer`

意图不明（图+视频但未说清动作 vs 运镜）→ 默认走本工具（动作迁移）。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `prompt` | STRING | 是 | -- | -- | 动作/场景描述；缺失可根据参考视频自动生成简要描述 |
| `image_list` | ARRAY | 是 | 1 张 | -- | 人物参考图 URL |
| `reference_video_list` | ARRAY | 是 | 1 个，≤15s | -- | 动作参考视频 URL |
| `video_duration` | NUMBER | 否 | 3–15 | 5 | 视频时长（秒） |
| `aspect_ratio` | STRING | 否 | 16:9 / 1:1 / 9:16 | adaptive | 画面比例 |

**工具调用**

```bash
meitu video-motion-transfer \
  --skill_name skill_video-motion-transfer \
  --prompt "{prompt}" \
  --image_list '["{person_image_url}"]' \
  --reference_video_list '["{motion_video_url}"]' \
  --video_duration 5 \
  --aspect_ratio adaptive \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `image_list` 缺失 | 提示"请提供人物参考图" |
| `reference_video_list` 缺失 | 提示"请提供动作参考视频" |
| `video_duration` > 15s | 钳位至 15s，告知用户 |
| 参考视频无明显人体动作 | 正常调用，告知效果可能不理想 |
| `prompt` 缺失 | 根据参考视频内容自动生成简要描述 |
| 图片/视频 URL 不可访问 | 不重试，提示"请提供有效链接" |
| 未检测到人物 | 返回错误：参考图需包含清晰人物 |
| 调用失败 | 重试 1 次，仍失败返回错误 |
| 超时（>600s） | 降低时长重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

解析 `--json` → `downloaded_files[0].saved_path` 或 `media_urls[0]`。

`mv {file} {output_dir}/{YYYY-MM-DD}_{name}_motion-transfer.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_motion-transfer.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-motion-transfer/`

## 基线 Task ID

```
t_mt1a3i5n7b5d0785f3-ea01-42a0-8e22-08a334d81361
```

