---
name: image-lowlight-enhance
description: "暗光/夜景/曝光不足图片的智能提亮与暗部细节恢复，保持亮部不过曝的前提下提亮暗部。当用户说图片太暗、太黑、夜景提亮、夜拍修复、暗光修复、曝光不足、逆光、提亮 时触发。"
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

# 图片暗部增强（image-lowlight-enhance）

## Overview

暗光/夜景/曝光不足图片的智能亮度提升与暗部细节恢复。覆盖夜景拍摄提亮、暗光环境照片修复、曝光不足挽救、逆光/高对比场景补光；保持亮部不过曝的前提下提亮暗部、暗部噪点自动抑制。仅需 `image_url`，不需要 prompt。

## API Mapping

- 暗光/夜景图片增强：`image_lowlight_enhance`

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
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-lowlight-enhance/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 太暗 / 夜景 / 曝光不足 | 太暗、夜景、提亮、暗光、逆光、曝光不足 | `image_lowlight_enhance` |

决策顺序：
1. `image_url` 缺失 → 追问
2. 唯一路由：调用 `image_lowlight_enhance`

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误；不做跨工具兜底。图片本身曝光正常 → 正常调用，告知用户"原图曝光正常，增强后可能偏亮"。极度欠曝（纯黑）→ 正常调用，效果可能有限。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | -- | 图片地址。缺失 → 提示"请提供需要增强的图片" |

**工具调用**

```bash
meitu image-lowlight-enhance \
  --skill_name skill_image-lowlight-enhance \
  --image_url <image_url> \
  --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要增强的图片" |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| 图片本身曝光正常 | 正常调用，告知"原图曝光正常，增强后可能偏亮" |
| 极度欠曝（纯黑） | 正常调用，效果可能有限，告知用户 |
| `image_lowlight_enhance` 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 返回合规提示，不重试 |
| 视频输入 | 拒绝，仅支持图片 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-lowlight-enhance.jpg`

## Output

- **格式**：JPEG/PNG（保持原格式）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-lowlight-enhance.jpg`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-lowlight-enhance/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
