---
name: image-background-replace
description: "替换图片整体背景/换场景，保留前景主体不变。当用户说换背景、替换背景、换成 xx 背景、商品换场景、人像换背景、证件照换底色、换底时触发。本工具不能输出透明背景。执行时会使用本地 meitu CLI、Meitu OpenAPI 凭证并写入本地输出目录。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"dataFlow":"Inputs, selected local context, and generated prompts may be sent to Meitu OpenAPI when used by the workflow.","credentials":"Credentials are used only for CLI authentication and must not be disclosed."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "Input images and background prompts are sent to Meitu OpenAPI."
  persistence: "Generated images are written to the resolved output directory."
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

# 图片换背景（image-background-replace）

## Overview

对已有图片做整体背景替换/换场景，保留前景主体不变。覆盖商品换场景、人像换背景、宠物换场景、电商白底图、证件照换底色（白/蓝/红）、文字描述任意目标场景的 AI 生成。本工具不能输出透明背景。

## API Mapping

- 背景替换：`image_gummy_generate_v45`

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
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-background-replace/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 整体背景替换 | 换背景、换场景、换底色、证件照换底 | `image_gummy_generate_v45` |

决策顺序：
0. **前置拦截**：prompt 含"透明"/"透明底"/"透明背景" → 不调用本工具，提示走抠图
1. **参数齐全判断**：`image_url` 缺失 → 追问；`prompt` 缺失 → 用默认"白色背景"
2. **唯一路由**：调用 `image_gummy_generate_v45`

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误；不做跨工具兜底。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | -- | 图片地址。缺失 → 提示"请提供需要换背景的图片" |
| `prompt` | STRING | 是 | -- | 白色背景 | 目标背景描述。用户未指定 → 默认"白色背景"并告知可描述具体场景 |

**工具调用**

```bash
meitu image-background-replace \
  --skill_name skill_image-background-replace \
  --image_url <image_url> \
  --prompt "<target_background_description>" \
  --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要换背景的图片"，不调用 API |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| `prompt` 缺失 | 使用默认值"白色背景" |
| 未检测到前景主体 | 返回错误，提示需包含可识别的前景主体，不重试 |
| `image_gummy_generate_v45` 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 生成背景与前景不协调 | 建议用户调整 prompt 后重试 |
| 用户同时说"换背景"和"透明底" | 本工具不能输出透明背景，不调用 |
| 视频换背景 | 拒绝，本工具不支持视频 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-background-replace.png`

## Output

- **格式**：PNG（非透明）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-background-replace.png`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-background-replace/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

