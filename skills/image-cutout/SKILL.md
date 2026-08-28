---
name: image-cutout
description: "图片前景主体与背景精准分离，仅支持人物、宠物、商品、图标、印章五类主体并输出透明底 PNG。用户明确要求抠图、去背景、透明背景/透明底或提取上述主体时触发；非五类主体和白底隔离不支持。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"dataFlow":"Input images and optional model_type values are sent to Meitu OpenAPI when used by the workflow.","credentials":"Credentials are used only for CLI authentication and must not be disclosed."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or placed in user-controlled parameters."
  remote_processing: "Input images and optional model_type values are sent to Meitu OpenAPI."
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
        - ./
        - ~/.openclaw/workspace/visual/
        - ./openclaw.yaml
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
        - ./output/
        - $VISUAL/output/image-cutout/
        - ~/.openclaw/workspace/visual/output/image-cutout/
    - type: exec
      commands:
        - meitu
---

# 图片抠图（image-cutout）

## Overview

对已有图片做前景主体与背景的精准分离。仅人物、宠物、商品、图标、印章五类主体可调用 SOD，并输出透明底 PNG；非五类主体和白底隔离不调用替代 API。

## DAG / API Mapping

- DAG 路由定位：这是 `dag_existing_tool_routes` 中的现有 Meitu 工具路由，不是新建的 `dag_native` 命令；参数与执行契约以 `tools[].cli` 为准。
- CLI 入口：`meitu image-cutout`；`image_url` 必填，`model_type` 可选。
- MCP 入口：`image_cutout`，`api_path=/v1/hydra_async`，`api_task_type=mtlab`。
- MCP 对外参数：`image_url` 必填；`model_type` 可选（0=人像、1=商品、2=图形），不传由模型自动判断。
- MCP 内部固定请求：`request_payload.parameter.api_path=/v1/sod_2c_async`、`function_path=image-cutout`、`use_fe_rgba=true`。`use_fe_rgba` 不是用户参数，不得暴露为 CLI 选项或要求用户提供。
- CLI 与 MCP 的用户参数保持一致；`prompt`、`target_subject`、`exclude_subjects` 均不是对外参数。

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
| 标准五类主体 | 人物/宠物/商品/图标/印章 | 透明底抠图路径 | 透明底 PNG |
| 非标准主体 | 建筑/植物/车辆/食物/家具/其他 | 返回 `UNSUPPORTED_SUBJECT_CATEGORY` | 不调用 |
| 用户明确要求白底 | 白底、纯白背景 | 返回 `UNSUPPORTED_SUBJECT_CATEGORY` | 不调用 |
| 主体类型无法判断 | 无法确认是否属于五类 | 先向用户确认 | 不调用 |

决策顺序：
1. Agent 先识别图片主体是否属于支持的五类
2. 属于五类 → 通过 CLI 调用 `meitu image-cutout`；否则返回不支持
3. 用户明确指定模型时校验 `model_type` 为 `0`、`1` 或 `2`；未指定时省略该参数，由模型自动选型

**CLI 参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | 图片地址。缺失 → 提示"请提供需要抠图的图片" |
| `model_type` | INTEGER | 否 | 自动判断 | `0` 人像、`1` 商品、`2` 图形；仅允许这三个值 |

**MCP 对外参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | 单张待处理图片 |
| `model_type` | INTEGER | 否 | 自动判断 | `0` 人像、`1` 商品、`2` 图形 |

CLI 已暴露可选的 `model_type`；不传时由 MCP 自动选型。MCP 内部必须保持 `use_fe_rgba=true`；`prompt`、`target_subject`、`exclude_subjects` 均不是 MCP 对外参数。

**工具调用**

```bash
meitu image-cutout \
  --skill_name skill_image-cutout \
  --image_url <image_url> \
  --json \
  --download-dir {output_dir}
```

上例省略 `--model_type`，由模型自动选型；明确指定人像、商品或图形模型时，分别添加 `--model_type 0`、`--model_type 1` 或 `--model_type 2`。

**批处理**

批量处理整个图片目录时，`--model-type` 是所有条目共用的可选模型参数：

```bash
meitu batch image-cutout \
  --input-dir ./images \
  --output-dir ./outputs \
  --skill_name skill_image-cutout
```

整个批次需要共用固定模型时，添加 `--model-type 0`、`--model-type 1` 或 `--model-type 2`；省略时自动选型。

需要逐条指定模型时使用 JSON 或 YAML 配置。条目字段 `modelType`（兼容别名 `model_type`）映射到单次命令的 `model_type`：

```yaml
version: 1
defaults:
  outputDir: ./outputs
items:
  - input: ./images/person.jpg
    modelType: 0
  - input: ./images/product.jpg
    modelType: 1
```

批处理默认并发数为 3，输出为 `.png`；未提供 `modelType` 的条目由模型自动选型。

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要抠图的图片"，不调用 |
| `image_url` 不可访问 | 返回图片链接无效错误，不重试 |
| `model_type` 未提供 | 省略该参数，由模型自动选型 |
| `model_type` 不为 `0`、`1`、`2` | 返回参数错误，提示用户选择有效模型，不调用 |
| 未检测到前景主体（标准路径）| 返回错误，提示需包含清晰前景主体 |
| 透明底抠图路径失败 | 重试 1 次，仍失败返回错误 |
| 非五类主体或白底隔离 | 返回 `UNSUPPORTED_SUBJECT_CATEGORY`，不调用、不重试、不降级 |
| 内容合规拦截 | 返回合规提示，不重试、不降级 |
| 用户说"替换为透明背景" | 虽含"替换"但目标是透明 → 走本工具，不走背景替换 |
| 视频输入 | 拒绝，仅支持图片 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 从 `downloaded_files[0].saved_path` 读取已下载文件路径
- `mv {downloaded_files[0].saved_path} {output_dir}/{YYYY-MM-DD}_{descriptive}_image-cutout.png`

## Output

- **格式**：透明底 PNG
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-cutout.png`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-cutout/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
