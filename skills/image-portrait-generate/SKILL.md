---
name: image-portrait-generate
description: "从参考图（人像/宠物）生成高精度写真，覆盖证件照/形象照/艺术照/宠物写真/多人写真/发型调整以及双人合影合成。仅在用户明确要求写真生成、人像风格化或双人合照合成时触发。"
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

# Image Portrait Generate

## Overview

从参考图（人像/宠物）生成高精度写真，覆盖单人/宠物/多人写真（证件照/形象照/艺术照/发型调整/场景变换）和双人合影合成。支持 2K/4K 分辨率。仅在用户明确要求写真生成或双人合照合成时触发，不用于泛化的“合影”“团体照”闲聊场景。

## API Mapping

- 单人/宠物/多人写真（主）：`image_gummy_edit_v45`
- 单人/宠物写真降级（兜底）：`image_mint_portrait_edit_2k`
- 双人合影合成：`image_groupphoto2_edit`
- model 映射：`auto`（默认）/`gummy_pro`→v45 / `mint_portrait`→mint_2k

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-portrait-generate/`

### Execute

**触发信号 / 路由规则**

核心维度：**输入图片数 + 合影信号**。

| 场景 | 判定关键词 | 图片数 | 路由 |
|------|----------|---|------|
| 双人合影 | 合影、合照、两个人合成 | 恰好 2 | `image_groupphoto2_edit` |
| 双人合影但不足 2 张 | 合影 | 1 | 提示"请提供两张人像照片" |
| 双人合影但超过 2 张 | 合影 | >2 | 取前 2 张 + 告知 |
| 单人 / 宠物写真 | 写真、证件照、形象照、发型、宠物写真 | 1 或 >1 | `image_gummy_edit_v45` → `image_mint_portrait_edit_2k` |
| 多人写真（3 人+） | 团体照、3 人写真 | 1（多人图） | `image_gummy_edit_v45`（不降级） |
| 意图不明 + 2 张图 | -- | 2 | 默认走单人写真 |

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|------|------|------|------|------|------|
| `image_list` | ARRAY[STRING] | 是 | 1–N 张 | -- | 人像/宠物图片 URL 数组 |
| `prompt` | STRING | 是 | -- | -- | 写真描述；缺失时根据上下文自动生成 |
| `size` | STRING | 否 | 2K / 4K | 2K | 输出分辨率（仅 `image_gummy_edit_v45` 支持） |

API 映射说明：

- `image_gummy_edit_v45`（主）：`image_list[0]`→`image_url`（API 本身支持多人），`prompt`/`size` 直传
- `image_mint_portrait_edit_2k`（降级）：`image_list[0]`→`image_url`，`prompt` 直传
- `image_groupphoto2_edit`（双人合影）：`image_list` 数组（必须恰好 2 张），`prompt`→`instruction`（非中英文自动翻译为中文）；固定参数 `lora_key=multi_duorenhezhao_2k`、`rsp_media_type=url`

证件照 + 指定底色（蓝/白/红）：在 `prompt` 中写入底色要求（如"蓝色纯色背景证件照"）。

**工具调用**

```bash
meitu image-portrait-generate --image_list <img1>[,<img2>,...] --prompt "<desc>" [--size 2K|4K] --json   --skill_name skill_image-portrait-generate
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_list` 缺失 | 提示"请提供参考图片"，不调用 API |
| `image_list` 中任一图片不可访问 | 返回图片链接无效错误，不重试 |
| `prompt` 缺失 | 根据上下文自动生成 |
| 合影但仅 1 张 | 提示"请提供两张人像照片" |
| 合影且 >2 张 | 取前 2 张并告知 |
| 写真但给 2 张 | 默认走单人写真 |
| `image_gummy_edit_v45` 失败（单人/宠物） | 自动降级至 `image_mint_portrait_edit_2k` |
| `image_mint_portrait_edit_2k` 失败 | 返回错误 |
| `image_gummy_edit_v45` 失败（多人/3 人+） | **不降级**，直接返回错误 |
| `image_groupphoto2_edit` 失败 | 返回错误 |
| 未检测到人脸/宠物 | 返回错误：参考图需包含清晰人像或宠物 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_image-portrait-generate.{ext}`

## Output

- **格式**：image
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-portrait-generate/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
