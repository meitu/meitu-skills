---
name: image-outfit-swap
description: "AI 换装，保留人物面部/体型只替换衣物，支持文字描述或服装参考图。当用户提到换装、换衣服、试穿、穿上、改成 xxx 服装、虚拟试穿、服装替换、把裙子改成红色时触发。"
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

# Image Outfit Swap

## Overview

对已有人物图片做 AI 换装，保留人物面部 / 体型 / 形象只替换衣物，支持文字描述目标服装或上传服装参考图（人物图+服装图通过 image_list 传入）。简单颜色修改（如"把裙子改成红色"）也属于本工具。

## API Mapping

- 换装主路径：`image_praline_edit_v2`
- 换装降级：`image_praline_edit_2`
- 工具内兜底：`image_mint_edit`
- model 映射：`auto`（默认）/`praline_pro`→v2 / `praline_lite`→edit_2 / `mint_edit`→mint

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-outfit-swap/`

### Execute

**触发信号 / 路由规则**

| 场景 | 判定条件 | 路由 |
|------|----------|------|
| 换装 / 换衣服 | 换装、换衣服、试穿、穿上、改成 xxx 服装 | `image_praline_edit_v2` → `image_praline_edit_2` → `image_mint_edit` |
| 虚拟试穿（有服装图） | 用户上传了 clothes_image_url | `image_praline_edit_v2`（image_list=[人物图, 服装图]） |
| 简单颜色修改（衣服） | 把裙子改成红色 | `image_praline_edit_v2` |

**参数定义**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | STRING | 是 | 人物图片地址。缺失 → 提示"请提供需要换装的人物图片" |
| `prompt` | STRING | 是 | 目标服装描述。缺失 → 提示"请描述目标服装款式" |
| `clothes_image_url` | STRING | 否 | 服装参考图地址。提供时与 image_url 一起通过 image_list 传入 `image_praline_edit_v2` |

API 映射说明：

- `image_praline_edit_v2`（主路径）：`prompt` 自动扩写为英文换装指令（如 `"Change the person's outfit to a white linen shirt, keep face and body unchanged"`）
- `image_praline_edit_2`（降级）：`prompt` 直传
- `image_mint_edit`（兜底）：`prompt` 直传

**工具调用**

```bash
meitu image-outfit-swap --image_url <person> --prompt "<target outfit>" --json
# 带服装参考图
meitu image-outfit-swap --image_url <person> --clothes_image_url <clothes> --prompt "<target outfit>" --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要换装的人物图片"，不调用 API |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| `prompt` 缺失 | 提示"请描述目标服装款式" |
| `prompt` 过于模糊 | 提示细化描述（款式 / 颜色 / 材质 / 风格） |
| 图片无明显人物 | 返回错误，提示需包含清晰人物 |
| `image_praline_edit_v2` 调用失败 | 自动降级至 `image_praline_edit_2` |
| `image_praline_edit_2` 调用失败 | 自动降级至 `image_mint_edit` |
| `image_mint_edit` 调用失败 | 返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_image-outfit-swap.{ext}`

## Output

- **格式**：image（PNG/JPG 由 API 决定）
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-outfit-swap/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
