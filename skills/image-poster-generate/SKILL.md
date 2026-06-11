---
name: image-poster-generate
description: "文/图生海报，多风格多尺寸带排版，支持参考图/已有海报修改文字/背景/元素。当用户提到海报、宣传图、广告图、Banner、推广图、营销图、活动海报、促销海报、poster时触发。"
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

# Image Poster Generate

## Overview

文/图生海报，多风格多尺寸，支持海报编辑、文字修改、换背景。覆盖促销海报、活动宣传图、广告 Banner、社交媒体配图、品牌推广图。

## API Mapping

- 海报生成：`image_poster_generate`
- model 值（**首字母大写**，与 image-edit 的 snake_case 命名空间不同）：`Praline_2`（默认）/ `GummyV4.5` / `PralineV2` / `Gummy` / `Nougat`

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-poster-generate/`

### Execute

**触发信号 / 路由规则**

核心维度：**参数齐全 + 海报场景命中 + model 选型**。

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 文生海报（无参考图） | 海报、宣传图、Banner | `image_poster_generate` |
| 图生海报 / 海报编辑（有 image_list） | 修改这张海报、参考海报 | `image_poster_generate` + `image_list` |

model 选型（**首字母大写**，与 image-edit 的 snake_case 命名空间不同）：默认 `Praline_2`（综合），写实人像 → `GummyV4.5`，高创意 → `PralineV2`，通用人像 → `Gummy`，特殊风格 → `Nougat`。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|------|------|------|------|------|------|
| `prompt` | STRING | 是 | -- | -- | 海报描述。缺失 → 提示"请描述您想要的海报内容" |
| `model` | STRING | 否 | Gummy / Nougat / PralineV2 / GummyV4.5 / Praline_2 | Praline_2 | 模型选择（注意首字母大写，区别于 image-edit） |
| `image_list` | ARRAY | 否 | -- | -- | 参考图片 URL 数组 |
| `ratio` | STRING | 否 | auto / 1:1 / 1:3 / 3:1 / 2:1 / 1:2 / 3:2 / 2:3 / 4:3 / 3:4 / 4:5 / 5:4 / 9:16 / 16:9 / 10:16 / 16:10 / 21:9 | auto | 宽高比 |
| `size` | STRING | 否 | auto / 1K / 2K / 4K / 512 | auto | 分辨率 |
| `output_format` | STRING | 否 | jpeg / png / webp | png | 输出格式 |
| `enhance_prompt` | BOOLEAN | 否 | true / false | false | 是否优化 prompt（描述 <15 字时建议开启） |
| `enhance_template` | STRING | 否 | -- | -- | 优化模板（仅 enhance_prompt=true 时生效） |

**工具调用**

```bash
meitu image-poster-generate --prompt "<desc>" [--model Praline_2] [--ratio 9:16] [--size auto] [--image_list <url>] --json --skill_name skill_image-poster-generate
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `prompt` 缺失 | 提示"请描述您想要的海报内容" |
| `model` 无效 | 回退至默认 `Praline_2` |
| `ratio` 超出范围 | 选择最接近可选值，或回退 auto |
| `size` 超出范围 | 回退至 auto |
| `image_list` 中图片 URL 无效 | 不重试，提示"请提供有效图片链接" |
| `image_poster_generate` 调用失败 | 重试 1 次，仍失败返回错误 |
| 超时（1200s） | 重试 1 次，仍超时返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 用户描述 <15 字 | 建议开启 `enhance_prompt=true` |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_image-poster-generate.{ext}`

## Output

- **格式**：PNG（默认）/ JPEG / WebP
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-poster-generate/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

