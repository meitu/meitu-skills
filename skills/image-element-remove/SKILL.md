---
name: image-element-remove
description: "从已有图片里去掉水印/文字/局部物体，覆盖通用水印消除、文档半透明水印消除、局部物体消除、指定文字消除。当用户说去水印、去掉水印、去 Logo、去角标、去全部文字、去路人、消除杂物、去掉'xxx' 时触发。"
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

# 图片消除（image-element-remove）

## Overview

对已有图片做元素消除（去水印/去文字/去局部物体），覆盖 4 类场景：通用水印消除（一键去水印含半透明）、文档场景半透明水印、局部物体/元素/指定文字消除、降级兜底链。路由铁律：用户指定具体文字内容时必须走 `image_praline_edit_v2`（路径 C），禁止走通用 API（否则清除全部文字）。

## API Mapping

- 通用水印/全部文字消除：`image_watermark_text_remove`
- 文档场景半透明水印：`image_saomiaowatermark_remove`
- 局部物体消除（主）：`image_praline_edit_v2`
- 局部物体消除（降级）：`image_praline_edit_2`
- 局部物体消除（兜底）：`image_mint_edit`

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
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-element-remove/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

核心判断维度：**前置判断（指定文字？） + 消除内容类型**。

决策顺序：
1. **前置判断（路由铁律）**：用户引用/描述了特定文字内容？
   - ✅ 是 → **强制走** `image_praline_edit_v2`（禁止走 `image_watermark_text_remove`）
   - ❌ 否 → 继续分类
2. 按消除内容分支：
   - 路径 A：去水印 / 去全部文字（全量词） → `image_watermark_text_remove`
   - 路径 B：明确文档场景半透明水印 → `image_saomiaowatermark_remove`
   - 路径 C：局部物体/指定文字 → `image_praline_edit_v2` → 降级链

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 指定具体文字内容（铁律） | 去掉'xxx'、去除文字'xxx' | **`image_praline_edit_v2`** |
| 通用水印 | 去水印、去掉水印、去半透明水印 | `image_watermark_text_remove`，target=watermark |
| 全部文字（含全量词） | 去全部文字、所有文字、一键去文字 | `image_watermark_text_remove`，target=text |
| 文档场景半透明水印（用户原话明确） | 文档水印、扫描件水印、小说水印 | `image_saomiaowatermark_remove` |
| 局部物体/元素 | 去路人、去 Logo、消除杂物、去角标 | `image_praline_edit_v2` → 降级链 |
| 意图模糊（"去掉字"） | 未说全部也未指定具体内容 | 轻确认 |

**显式约束消除原则**：`image_praline_edit_v2/2/mint` 的消除 prompt 必须使用**四段式模板**（SCOPE + PRESERVE + REFLOW + NEGATIVE），显式锁定剩余元素 12 项视觉属性，防止模型顺手改动非目标元素。

**参数定义**

通用参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | STRING | 是 | 图片地址。缺失 → 提示"请提供需要处理的图片" |

`image_watermark_text_remove` 额外参数：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `target` | STRING | 否 | watermark / text | watermark | 消除目标类型 |

`image_praline_edit_v2/2/mint` 额外参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prompt` | STRING | 是 | 按四段式模板（SCOPE + PRESERVE + REFLOW + NEGATIVE）生成的英文消除指令 |

**四段式 prompt 模板**：

```
Task: Element removal.
Remove ONLY the specified element from the image: {target_description}.
STRICTLY PRESERVE all remaining visual elements, including: font family, size, color, weight, style, stroke, shadow, position, alignment, background, lighting, composition, and any other text or objects not targeted for removal.
If the removal affects part of a text segment, REFLOW the remaining text to read as a natural, complete phrase — close any gaps, maintain baseline and alignment, preserve visual balance and typographic consistency.
DO NOT modify any other elements in the image.
DO NOT change the overall color palette, lighting, composition, or style.
```

**工具调用**

```bash
# 通用水印
meitu image-element-remove --image_url <url> --target watermark --json   --skill_name skill_image-element-remove
```
```bash
# 指定文字/局部物体
meitu image-element-remove --image_url <url> --prompt "<four_segment_prompt>" --model praline_pro --json   --skill_name skill_image-element-remove
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要处理的图片" |
| `image_url` 不可访问 | 直接返回无效错误，不重试 |
| `image_watermark_text_remove` 失败 + 用户提到"半透明" | 降级 `image_saomiaowatermark_remove` → v2 → 2 → mint |
| `image_watermark_text_remove` 失败（非半透明） | 返回错误，不盲目降级 |
| `image_saomiaowatermark_remove` 失败 | 降级 v2 → 2 → mint |
| `image_praline_edit_v2` 失败 | 自动降级 `image_praline_edit_2` |
| `image_praline_edit_2` 失败 | 自动降级 `image_mint_edit` |
| `image_mint_edit` 失败 | 返回错误 |
| 未检测到水印/文字 | 返回原图，告知未检测到 |
| 内容合规拦截 | 返回合规提示，不重试、不降级 |

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 命名规则：`{YYYY-MM-DD}_{descriptive}_image-element-remove.jpg`

## Output

- **格式**：JPEG/PNG（保持原格式）
- **命名**：`{YYYY-MM-DD}_{descriptive}_image-element-remove.jpg`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-element-remove/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
