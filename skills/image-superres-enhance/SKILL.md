---
name: image-superres-enhance
description: "图片清晰度提升/超分放大，按内容类型自动选算法（通用/电商商品图/文字文档）。当用户提到变清晰、超清、高清修复、画质提升、超分、放大到 4K/2K/1080P、老照片修复、商品图超清、文档超清、扫描件变清晰时触发。"
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

# Image Superres Enhance

## Overview

对已有图片做清晰度提升 / 超分放大，按内容类型自动选最优算法，覆盖通用超分、电商商品图超分、文字文档超分。关键区分："放大到 4K/2K/1080P"（分辨率目标）走本工具；"放大 2/4/8 倍"（倍数放大）走 image-transform。

## API Mapping

- 通用超分：`api_v2_image_restoration_async`
- 电商商品图超分：`api_v1_dlbeautygoodsimagesr_async`
- 文字文档/扫描件超分：`api_v1_dlbeautytextimagesr_async`

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-superres-enhance/`

### Execute

**触发信号 / 路由规则**

核心维度：**Agent 画面识别的内容类型**（prompt 信号词）。

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 电商商品图 | 商品、产品、SKU、电商、白底商品 | `api_v1_dlbeautygoodsimagesr_async` |
| 文字文档 | 文档、文字、图表、扫描件、发票、合同、表格 | `api_v1_dlbeautytextimagesr_async` |
| 通用 / 未指定 | 人像、风景、老照片、其他 | `api_v2_image_restoration_async` |
| 混合内容 | -- | 默认走通用或询问 |
| 商品图 + 指定分辨率 | 商品图变 4K | `api_v1_dlbeautygoodsimagesr_async`（场景专用优于通用） |

路由原则：**场景专用优于通用**；Agent 调用前先识别图片内容生成 `prompt`，无法判断则 `prompt` 写"通用图片"走默认。

**参数定义**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | STRING | 是 | 图片地址。缺失 → 提示"请提供需要超清处理的图片" |
| `prompt` | STRING | 是 | Agent 对图片内容的描述，用于内部路由判断（如"电商白底商品图""扫描件文字文档""风景照片"） |

所有 API 仅使用 `image_url + prompt`，无额外参数。

**工具调用**

```bash
meitu image-superres-enhance --image_url <url> --prompt "<content desc>" --json   --skill_name skill_image-superres-enhance
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要超清处理的图片" |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| `prompt` 为空或无信号词 | 默认走 `api_v2_image_restoration_async` |
| 混合内容（文字 + 商品） | 询问或默认走通用 |
| 任一 API 调用失败 | 切换 `api_v2_image_restoration_async` 重试 1 次 → 仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |
| 商品图 + 指定分辨率 | 优先走商品超分（场景专用优先），分辨率由 API 内部处理 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_image-superres-enhance.{ext}`

## Output

- **格式**：image
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-superres-enhance/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

