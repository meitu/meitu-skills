---
name: image-text-replace
description: "图片上已有文字的内容替换（A → B），支持简单精准改字和复杂改字（花字/手写/多处/字符数变化）。当用户提到改字、替换文字、把 A 改成 B、修改文字、换个字、文字替换、改标题、改价格、改名字、改广告语时触发。"
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

# Image Text Replace

## Overview

对已有图片做文字内容替换：简单精准改字（标准印刷体/单处/≤6 字符/字符数不变四条件全满足）与复杂改字（花字/手写体/风格化/多处/字符数变化）。

## API Mapping

- 简单精准改字：简单改字路径。
- 复杂改字：优先 `praline_pro`，失败依次降级为 `praline_lite`、`mint_edit`。

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-text-replace/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

核心维度：**四条件判断**（必须同时满足）：

1. 字体类型：标准印刷体（宋体/黑体/楷体/圆体/衬线体/无衬线体/等宽字体）
2. 修改位置：只修改一处文字
3. 字符长度：修改的文字字符数 ≤ 6
4. 字符数恒等：原文字符数 = 修改后字符数

| 场景 | 判定 | 路由 |
|------|----------|------|
| 四条件全满足 | 标准印刷体 + 单处 + ≤6 字符 + 字符数不变 | 简单改字路径 → `praline_pro` → `praline_lite` → `mint_edit` |
| 花字 / 手写 / 风格化 | 花体字、手写、风格化 | `praline_pro` → `praline_lite` → `mint_edit` |
| 多处修改 | 改多个地方 | `praline_pro` → `praline_lite` → `mint_edit` |
| 字符数 >6 或 字符数变化 | 长文本 / 3 字→5 字 | `praline_pro` → `praline_lite` → `mint_edit` |

**参数定义**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | STRING | 是 | 图片地址。缺失 → 提示"请提供需要改字的图片" |
| `source_words` | STRING | 条件必填 | 原文字内容。简单改字必填；复杂改字可从 `prompt` 自动提取 |
| `target_words` | STRING | 条件必填 | 目标文字内容。简单改字必填 |
| `prompt` | STRING | 否 | 改字描述；复杂改字时根据 `source_words` / `target_words` 自动生成英文改字指令 |

简单改字路径直接传 `image_url`、`source_words` 和 `target_words`；复杂改字使用 `praline_pro`、`praline_lite` 或 `mint_edit`，并根据 `source_words`/`target_words` 构造英文改字指令。

目标文字含中文时，`prompt` 中目标文字**保持原样、不做翻译**。

**工具调用**

```bash
meitu image-text-replace --image_url <url> --source_words "<原文>" --target_words "<新文>" --json --download-dir {output_dir} --skill_name skill_image-text-replace
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要改字的图片" |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| `source_words` / `target_words` 缺失 | 提示"请告诉我要把哪个文字改成什么" |
| `source_words` 在图片中找不到 | 返回原图，告知未找到匹配文字 |
| 字符数改变 / 花字 / 多处 | 不走简单改字，直接使用 `praline_pro` |
| 简单改字路径调用失败 | 自动升级至 `praline_pro` |
| `praline_pro` 调用失败 | 自动降级至 `praline_lite` |
| `praline_lite` 调用失败 | 自动降级至 `mint_edit` |
| `mint_edit` 调用失败 | 返回错误 |
| 用户一次要改多张图 | 提示每次处理一张 |
| 用户未提供字体信息 | 按标准印刷体判断，先试简单 API；失败自动升级 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 从 `downloaded_files[0].saved_path` 读取已下载文件路径
- `mv {downloaded_files[0].saved_path} {output_dir}/{YYYY-MM-DD}_{descriptive}_image-text-replace.{ext}`

## Output

- **格式**：image
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-text-replace/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
