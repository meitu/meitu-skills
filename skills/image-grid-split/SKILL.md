---
name: image-grid-split
description: "自动识别宫格分割线，将单张多格图拆分为多张独立图片。当用户说四宫格拆分、九宫格拆开、切成四张、2x2/3x3 切图、宫格图分开、拼图拆分、格子图拆开 时触发。"
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

# 图片拆分（image-grid-split）

## Overview

自动识别宫格分割线，将单张多格图拆分为多张独立图片。覆盖四宫格/九宫格/六宫格等标准网格自动拆分，自动识别分割线位置；用于电商多图拼合图分离、社交媒体宫格图还原。仅需 `image_url`，无需指定宫格数。

## API Mapping

- 宫格拆分：`image_grid_split`

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
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-grid-split/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 宫格图拆分 | 四宫格、九宫格、切成多张、拼图拆开、格子图 | `image_grid_split` |

决策顺序：
1. `image_url` 缺失 → 追问
2. 唯一路由：调用 `image_grid_split`，自动检测分割线（无需用户指定宫格数）

单 API 工具：参数齐全即调用，失败重试 1 次后返回错误；不做跨工具兜底。非宫格图 / 未检测到分割线时按等分切割处理并告知用户。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | -- | 图片地址（需为宫格图）。缺失 → 提示"请提供需要拆分的宫格图" |

**工具调用**

```bash
meitu image-grid-split \
  --image_url <image_url> \
  --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要拆分的宫格图" |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| 非宫格图片 | 正常调用（按等分切割），告知用户结果可能不理想 |
| 未检测到分割线 | 按等分切割处理 |
| `image_grid_split` 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 返回合规提示，不重试 |
| 用户想裁剪某区域 | 本工具仅支持拆分宫格图，不支持裁剪 |
| 用户要拼合 | 方向相反，本工具仅拆分不拼合 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-grid-split_{idx}.jpg`（多张输出以 idx 递增）

## Output

- **格式**：JPEG/PNG（保持原格式，多张独立图片）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-grid-split_{idx}.jpg`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-grid-split/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
