---
name: image-denoise-enhance
description: "去除图片颗粒感/噪点/杂色，保留细节同时降噪。当用户说去噪、降噪、去颗粒、去噪点、杂色、颗粒感、画面脏、ISO 高、噪声时触发。"
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

# 图片去噪（image-denoise-enhance）

## Overview

去除图片颗粒感/噪点/杂色，保留图像细节同时降噪。覆盖高感光拍摄降噪、暗光拍摄噪点消除、老照片杂色修复、手机夜拍噪点处理、压缩产生的色块/伪影修复。仅需 `image_url`，不需要 prompt。

## API Mapping

- 图片去噪：`image_denoise_enhance`

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

1. `meitu --version` ≥ 2.0.6（否则 `npm install -g meitu-cli@latest ...`）
2. 确认已跑过 `meitu tools update`（用 CONFIG AKSK）
3. 当前 AKSK = EXEC，且 `MEITU_OPENAPI_TOOL_TASK_MODE=command`
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-denoise-enhance/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 噪点 / 颗粒 / 杂色 | 去噪、噪点、颗粒、杂色、画面脏、ISO 高 | `image_denoise_enhance` |

决策顺序：
1. `image_url` 缺失 → 追问
2. 唯一路由：调用 `image_denoise_enhance`

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误；不做跨工具兜底。图片无明显噪点仍正常调用，效果可能不明显。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | -- | 图片地址。缺失 → 提示"请提供需要去噪的图片" |

**工具调用**

```bash
meitu image-denoise-enhance \
  --image_url <image_url> \
  --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要去噪的图片" |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| 图片无明显噪点 | 正常调用，效果可能不明显，告知用户 |
| `image_denoise_enhance` 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 视频输入 | 拒绝，仅支持图片 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-denoise-enhance.jpg`

## Output

- **格式**：JPEG/PNG（保持原格式）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-denoise-enhance.jpg`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-denoise-enhance/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
