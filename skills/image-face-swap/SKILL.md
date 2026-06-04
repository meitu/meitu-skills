---
name: image-face-swap
description: "双图换脸/换头合成，将源图人脸替换到目标场景图上，保留目标图构图/身体/背景并自动肤色融合光影匹配。当用户说换脸、换头、P 脸、把 A 的脸换到 B 上、face swap、合成人像 时触发。执行时会使用本地 Meitu OpenAPI 凭证授权，并将源人脸图和目标场景图发送到 Meitu 外部服务处理。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"credentialUse":"Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI authentication; credentials must not be echoed, logged, or embedded in prompts.","remoteProcessing":"Source face images and target scene images are transmitted to Meitu OpenAPI for face-swap processing.","biometricNotice":"Face images are sensitive biometric-like personal data; users should understand that provided images are processed by an external Meitu service."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI authentication; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "Source face images and target scene images are transmitted to Meitu OpenAPI for face-swap processing."
  biometric_notice: "Face images are sensitive biometric-like personal data; users should understand that provided images are processed by an external Meitu service."
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

# 图片换脸（image-face-swap）

## Overview

双图换脸/换头合成，将源图人脸替换到目标场景图上。保留目标图的构图/身体/背景，自动肤色融合光影匹配；用于角色扮演、把自己的脸放到另一张图上、趣味合成。一次只换一张脸。

## API Mapping

- 双图换脸/换头合成：`image_face_swap`

## Dependencies

- **meitu-cli**: `>=2.0.6`（`npm install -g meitu-cli@latest`）
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 实际执行（见根 `CONFIG.md`）
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> 路径别名：`$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6（否则 `npm install -g meitu-cli@latest`）
2. 确认已跑过 `meitu tools update`（用 CONFIG AKSK）
3. 当前 AKSK = EXEC，且 `MEITU_OPENAPI_TOOL_TASK_MODE=command`
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-face-swap/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

核心判断维度：**图片数量 + head/sence 角色分配**。

| 场景 | 判定 | 路由 |
|------|------|------|
| 双图换脸 | 提供 2 张图，意图换脸 | `image_face_swap`，head/sence 按规则分配 |

决策顺序：
1. **图片数量**：不足 2 张 → 提示补图；超过 2 张 → 取前 2 张并告知
2. **角色分配**：
   - 用户明确指定 → 按指定分配 head / sence
   - 未区分 → 第 1 张 = head（人脸源），第 2 张 = sence（场景底图）
   - "用 B 换到 A" → B=head（源），A=sence
3. **唯一路由**：调用 `image_face_swap`

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误；不做跨工具兜底。侧脸/遮挡严重不阻断调用，但告知效果可能受限。

**参数定义**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `head_image_url` | STRING | 是 | -- | 人脸源图 URL |
| `sence_image_url` | STRING | 是 | -- | 场景底图 URL（保留构图/身体/背景） |
| `prompt` | STRING | 是 | -- | 附加提示词。缺失 → 提示"请描述换脸效果要求" |

**工具调用**

```bash
meitu image-face-swap \
  --skill_name skill_image-face-swap \
  --head_image_url <head_url> \
  --sence_image_url <sence_url> \
  --prompt "<effect_description>" \
  --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| 图片不足 2 张 | 提示"请提供两张图片：一张人脸源图，一张目标场景图" |
| 图片 3+ 张 | 取前 2 张（第 1=head，第 2=sence），告知用户 |
| `head_image_url` / `sence_image_url` 不可访问 | 返回图片链接无效错误，不重试 |
| 未检测到人脸（head） | 返回错误：人脸源图需包含清晰正脸 |
| `image_face_swap` 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 返回合规提示，不重试 |
| 侧脸 / 遮挡严重 | 不阻断调用，告知效果可能受限 |
| 视频换脸 | 拒绝，仅支持图片 |
| 多人同时换脸 | 本工具一次只换一张脸 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-face-swap.jpg`

## Output

- **格式**：JPEG/PNG（保持原格式）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-face-swap.jpg`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-face-swap/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
