---
name: image-edit
description: "对用户已提供的图片做明确内容编辑，或基于参考图创作新图片（必须有底图/参考图）。覆盖电商产品出图、人像编辑、多图与一致性编辑、通用图片编辑、参考图创作 5 类场景。仅当用户明确要求编辑当前图片时触发；普通文字修改、代码编辑、泛泛的“改一下/加一下”不触发。执行时会读取 Meitu 凭证、调用本地 `meitu` CLI，并将输入图片与提示词发送到 Meitu OpenAPI，结果写入本地输出目录。"
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

# 图生图（image-edit）

## Overview

对已有图片施加内容编辑或基于参考图创作全新图片（必须有底图）。覆盖 5 类场景：电商产品出图（白底/场景/多角度/带文字）、人像编辑（人脸/妆容/发型/姿态）、多图与一致性编辑、通用编辑（替换/添加/构图）、参考图创作（创意视觉稿/名片/封面）。涉及文字添加/替换时目标文字内容保持原样不翻译；"IP"指角色图案而非文字。

执行前应让用户清楚知道：本 Skill 会读取本地 Meitu 凭证、调用 `meitu image-edit`，并把输入图片、提示词及生成结果发送到/写回外部服务与本地输出目录。

## API Mapping

- 人像编辑：`image_gummy_edit_v45`
- 多图/一致性/通用/电商/参考图创作（主）：`image_praline_edit_v2`
- 通用编辑（降级）：`image_praline_edit_2`
- 工具内兜底：`image_mint_edit`
- Nougat 高质量（外部显式指定）：`image_nougat_edit`（路由不识别；image_list 最多 10 张；不支持 output_format；size 内部常量 2K；quality 由 API 内部默认 Medium 不对外暴露）

model 映射：`auto`（默认按路由）/`gummy_pro`→gummy/`praline_pro`→v2/`praline_lite`→2/`mint_edit`→mint/`nougat`→nougat_edit（外部显式指定触发）

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
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-edit/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

核心判断维度：**电商产品出图 → 前置判断（参考图创作 / 多图）→ 单图场景分类**。

决策顺序：
0. **前置 0 — 电商产品出图**：产品图 + 电商意图（白底/主图/场景/多角度/促销文字） → `image_praline_edit_v2`
1. **前置 A — 参考图创作**：有参考图 + 生成全新图意图 → `image_praline_edit_v2`
2. **前置 B — 多图输入**：`image_list` ≥ 2 张 → `image_praline_edit_v2`（强制使用 `image_list`）
3. **单图场景**（优先级：人像 > 一致性 > 通用）：
   - 人像（人脸/表情/妆容/发型/肤色/姿态/五官） → `image_gummy_edit_v45`
   - 一致性（商品微调/保持主体/已有图片文字替换） → `image_praline_edit_v2`
   - 通用（替换/添加/构图） → `image_praline_edit_v2`

**参数定义**

通用参数（所有 API 共用）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_list` | ARRAY[STRING] | 是 | 图片地址列表，所有 API 统一使用。缺失 → 提示"请提供图片" |
| `prompt` | STRING | 是 | 编辑描述。文字添加/替换场景目标文字保持用户原文不翻译；"IP"指图案/角色而非文字 |

`image_praline_edit_v2` 额外参数：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `ratio` | STRING | 否 | auto/1:1/2:3/3:2/3:4/4:3/4:5/5:4/9:16/16:9/21:9 | auto | 特殊比例需在 prompt 结尾写 `Aspect ratio x:y` |
| `size` | STRING | 否 | 1K/2K/4K | -- | 输出分辨率 |
| `output_format` | STRING | 否 | jpeg/png/webp | jpeg | 输出格式 |

model 参数（可显式指定绕过 auto 路由）：`gummy_pro`（人像）/`praline_pro`（通用）/`praline_lite`（降级）/`mint_edit`（兜底）/`nougat`（高质量，外部显式指定触发，路由不识别）。

**工具调用**

```bash
meitu image-edit \\
  --skill_name skill_image-edit \\
  --image_list <url1,url2> \\
  --prompt "<edit_description>" \\
  --json
```

可选：`--ratio 1:1 --size 2K --output_format png --model praline_pro`

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_gummy_edit_v45` 失败 | 重试 1 次 → 降级 `image_praline_edit_v2`，后续按 v2→2→mint |
| `image_praline_edit_v2` 失败 | 重试 1 次 → 降级 `image_praline_edit_2`（多图取 `image_list[0]`） |
| `image_praline_edit_2` 失败 | 重试 1 次 → 降级 `image_mint_edit` |
| `image_mint_edit` 失败 | 返回错误 |
| 内容合规拦截 | 返回合规提示，不重试、不降级 |
| 多图 + 人像意图 | 强制走 v2（gummy 仅支持单图），建议拆分单张处理 |
| prompt 含目标文字 | 文字内容保持原样、不翻译 |
| prompt 含"IP" | 保留"图案/角色"语义，不得转为"文字" |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-edit.{jpeg|png|webp}`

## Output

- **格式**：JPEG（默认）/PNG/WebP（由 `output_format` 决定）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-edit.jpg`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-edit/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

