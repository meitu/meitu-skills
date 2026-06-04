---
name: image-style-transfer
description: "对已有图片做风格化处理（动漫/油画/水彩/Q版/卡通/3D/像素/表情包等），支持单图风格化和双图参考风格迁移。当用户提到风格转换、风格迁移、变成 xxx 风格、表情包、emoji 风格、Q版、拼豆、玩具风、油画风、水彩风、动漫风、3D 风格、预设效果时触发。"
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

# Image Style Transfer

## Overview

对已有图片做风格化处理，两类能力：单图风格化（Q 版/emoji/史努比/molly/动森 5 种预设 + 其他通用风格）和双图参考风格迁移（原图 + 风格参考图，覆盖水彩/油画/动漫/3D 插画类）。

## API Mapping

- 预设风格化（chibi/emoji/snoopy/molly/动森 5 种）：`formula_group_creative_play`
- 单图通用风格化（主）：`image_praline_edit_v2`
- 单图通用风格化（降级）：`image_praline_edit_2`
- 参考图风格迁移：`image_mint_styletransfer`
- 双图兜底：`image_praline_edit_v2`
- 工具内兜底：`image_mint_edit`
- Nougat 高质量（外部显式指定）：`image_nougat_edit`（路由不识别；ratio 原生 11 枚举；size 内部常量 2K；quality 由 API 内部默认 Medium 不对外暴露）
- model 映射：`auto`（默认）/`praline_pro`→v2 / `praline_lite`→edit_2 / `mint_style`→styletransfer（必须同时提供 style_image_url，单图禁止指定）/ `mint_edit`→mint / `nougat`→nougat_edit（外部显式指定触发）

可选参数：`--model <auto|praline_pro|praline_lite|mint_style|mint_edit|nougat>`、`--ratio <auto|1:1|...|21:9>`（仅 `model=nougat` 路径生效，其他静默忽略）

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-style-transfer/`

### Execute

**触发信号 / 路由规则**

核心维度：**输入图片数量**。

| 输入图片数 | 条件 | 路由 |
|------|------|------|
| 1 张 | prompt 含 chibi（Q版）/ emoji / snoopy / molly / 动森 | `formula_group_creative_play` |
| 1 张 | 其他风格（油画/水彩/动漫/3D/卡通/像素等） | `image_praline_edit_v2` |
| 2 张 | 请求为插画类风格迁移 | `image_mint_styletransfer` |
| 2 张 | 请求为非插画类风格迁移 | `image_praline_edit_v2` |

路由原则：`formula_group_creative_play` 仅限 1 张图 + 5 种预设；`image_mint_styletransfer` 仅限 2 张图 + 插画类；图片数 >2 仅取前 2 张。

**参数定义**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | ARRAY[STRING] | 是 | 图片地址列表。1 张=原图；2 张=`[原图, 风格参考图]`，顺序固定 |
| `prompt` | STRING | 是 | 用户目标风格描述，用于效果检索和兜底处理 |
| `model` | STRING | 否 | `auto` / `praline_pro` / `praline_lite` / `mint_style` / `mint_edit` / `nougat` |
| `ratio` | STRING | 否 | 仅 `model=nougat` 路径生效；其他 model 静默忽略 |

API 映射说明：

- `formula_group_creative_play`：`image_url[0] + effect_id`（effect_id 由工具内部根据 prompt 风格关键词自动匹配，不暴露）
- `image_mint_styletransfer`：`image_url[0]`（原图）+ `image_url[1]`（风格参考图）+ `prompt`
- `image_praline_edit_v2`：按兜底工具实际参数要求映射

**工具调用**

```bash
meitu image-style-transfer --image_url <origin>[,<style_ref>] --prompt "<style desc>" --json   --skill_name skil_image-style-transfer
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `formula_group_creative_play` 调用失败 | 重试 1 次，仍失败走 `image_praline_edit_v2` |
| `image_praline_edit_v2` 调用失败（单图） | 降级至 `image_praline_edit_2` |
| `image_praline_edit_2` 调用失败（单图） | 降级至 `image_mint_edit` |
| `image_mint_edit` 调用失败（单图） | 返回错误 |
| `image_mint_styletransfer` 调用失败 | 重试 1 次，仍失败走 `image_praline_edit_v2` |
| `image_praline_edit_v2` 调用失败（双图） | 降级至 `image_praline_edit_2` |
| `image_praline_edit_2` 调用失败（双图） | 降级至 `image_mint_edit` |
| `image_mint_edit` 调用失败（双图） | 返回错误 |
| 2 张图但非插画类风格 | 走 `image_praline_edit_v2` |
| 1 张图但不属于 5 种预设 | 走 `image_praline_edit_v2` |
| 图片数 >2 | 仅取前 2 张按双图分支处理 |
| 写实人像写真 / 视频创意生成 | 直接拒绝，不调用任何 API |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_image-style-transfer.{ext}`

## Output

- **格式**：image
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-style-transfer/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

