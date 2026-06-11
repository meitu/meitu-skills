---
name: image-cutout
description: "图片前景主体与背景精准分离，输出透明底 PNG（标准四类：人物/宠物/商品/图形印章）或白底图（非标准主体/用户要白底）。当用户说抠图、去背景、透明背景、透明底、白底、提取主体、remove background 时触发。执行时会使用本地 meitu CLI、Meitu OpenAPI 凭证并写入本地输出目录。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"dataFlow":"Inputs, selected local context, and generated prompts may be sent to Meitu OpenAPI when used by the workflow.","credentials":"Credentials are used only for CLI authentication and must not be disclosed."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "Input images and subject prompts are sent to Meitu OpenAPI."
  persistence: "Generated cutout images are written to the resolved output directory."
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

# 图片抠图（image-cutout）

## Overview

对已有图片做前景主体与背景的精准分离。标准四类主体（人物/宠物/商品/图形印章）走 `api_v1_sod_async` 输出透明底 PNG；非标准主体（建筑/植物/车辆/食物/家具等）或用户明确要求白底的场景走 `image_praline_edit_v2` 输出白底图（RGB 255,255,255）。任何涉及"透明背景/透明底"的需求都归本工具。

## API Mapping

- 标准四类主体抠图（透明底 PNG）：`api_v1_sod_async`
- 非标准主体白底抠图（主）：`image_praline_edit_v2`
- 非标准主体白底抠图（降级）：`image_praline_edit_2`
- 非标准主体白底抠图（兜底）：`image_mint_edit`

model 映射：`auto`（默认按路由）/`praline_pro`→v2/`praline_lite`→2/`mint_edit`→mint

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
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-cutout/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

核心判断维度：**Agent 画面识别的主体类型**。

| 场景 | 判定关键词 | 路由 | 输出 |
|------|----------|------|------|
| 标准四类主体 | 人物/宠物/商品/图形印章 | `api_v1_sod_async` | 透明底 PNG |
| 非标准主体 | 建筑/植物/车辆/食物/家具/其他 | `image_praline_edit_v2` | 白底 RGB(255,255,255) |
| 用户明确要求白底 | 白底、纯白背景 | `image_praline_edit_v2` | 白底 |
| 主体类型无法判断 | Agent 识别失败 | `api_v1_sod_async` 默认 | 透明底 |

决策顺序：
1. Agent 先识别图片主体类型，生成 `prompt` 描述
2. 按主体类型分 2 路（并行判断，非串联降级）
3. 用户要白底 + 主体是人物 → 仍走 `image_praline_edit_v2`（白底优先级更高）

**参数定义**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | 图片地址。缺失 → 提示"请提供需要抠图的图片" |
| `prompt` | STRING | 是 | -- | Agent 对图片主体的描述（如"白底商品图，主体为运动鞋"） |

`image_praline_edit_v2` 内部 prompt（系统自动追加，不暴露给用户）：
> 结合图片分析，根据指令锁定图像主体（保持原貌不形变），将背景重置为纯白（RGB 255, 255, 255）

**工具调用**

```bash
meitu image-cutout \
  --skill_name skill_image-cutout \
  --image_url <image_url> \
  --prompt "<subject_description>" \
  --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要抠图的图片"，不调用 |
| `image_url` 不可访问 | 返回图片链接无效错误，不重试 |
| `prompt` 为空 | Agent 识别主体生成 prompt；无法判断默认走 `api_v1_sod_async` |
| 未检测到前景主体（标准路径）| 返回错误，提示需包含清晰前景主体 |
| `api_v1_sod_async` 失败 | 重试 1 次，仍失败返回错误 |
| `image_praline_edit_v2` 失败 | 重试 1 次 → 降级 `image_praline_edit_2` |
| `image_praline_edit_2` 失败 | 降级 `image_mint_edit` |
| `image_mint_edit` 失败 | 返回错误 |
| 内容合规拦截 | 返回合规提示，不重试、不降级 |
| 用户说"替换为透明背景" | 虽含"替换"但目标是透明 → 走本工具，不走背景替换 |
| 视频输入 | 拒绝，仅支持图片 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-cutout.png`

## Output

- **格式**：PNG（标准四类透明底 / 非标准主体白底）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-cutout.png`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-cutout/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

