---
name: text-generate
description: "使用 meitu-cli 调用独立 LLM 从零生成文本/文案/分镜脚本/视频提示词。当用户提到写文案、润色、改写、广告语、产品描述、社交媒体文案、文章、分镜脚本、storyboard、提示词优化时触发。上下文已有完整内容时禁用，应改用 write_file。"
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

# Text Generate（文本生成）

## Overview

独立 LLM 深度创作工具，从零生成文案/脚本/分镜/视频提示词等纯文本内容。覆盖营销文案、产品描述、社交媒体文案、文章/博客、广告语、内容润色改写、多语言文案、图片/视频参考文案、视频分镜规划、视频提示词优化。⚠️ 上下文中已有完整内容时禁止调用，应改用 `write_file` 直接落盘；仅当上下文只有方向性需求、需要 LLM 独立深度思考时使用。不处理：视频/图片/音频/代码/表格生成。

## API Mapping

| 场景 | 后端 API | 底层模型 |
|------|---------|---------|
| 通用文本 / 分镜脚本生成 | `text_generate` | `qwen3.6-vl-plus`（scone）/ `gemini-3.1-pro-preview`（pretzel_pro）|

model 映射：

- `auto`（默认）/ 不传 → 按路由规则决策
- `scone` → `qwen3.6-vl-plus`（日常主力）
- `pretzel_pro` → `gemini-3.1-pro-preview`（视频理解最强，长上下文）
- 双模型互为兜底

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令（见根 `CONFIG.md`）
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6
2. `meitu auth verify --json`
3. 确认 registry 含 `text-generate`
4. 解析 output_dir：`openclaw.yaml` → `./output/`；else → `~/.openclaw/workspace/visual/output/text-generate/`

### Execute

**触发信号 / 路由规则**

| 场景 | 判定维度 | 路由 |
|------|---------|------|
| 有视频参考 | `video_list` 非空 | 锁定 `gemini-3.1-pro-preview`（pretzel_pro）|
| 高难度场景 | 调用方显式传 `model=pretzel_pro` | `gemini-3.1-pro-preview` |
| 日常场景 | `auto` / 未传 model | `qwen3.6-vl-plus`（scone，日常默认）|

高难度判定标准（由调用方判断）：视频输入、长上下文 >2000 字、复杂推理（多步逻辑/对比分析/因果论证）、专业领域（法律/医学/金融/学术）、多约束创作（≥3 创作约束同时）、跨语言深度适配、多镜头分镜脚本规划。

**参数定义**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `summary` | STRING | 是 | -- | 文案/分镜需求描述。应含文案类型、目标受众、核心目标、风格；分镜场景需含主题、镜头数、场景描述。缺失 → 追问 |
| `language` | STRING | 是 | 简体中文 | 输出语言，跟用户输入语言一致 |
| `model` | STRING | 否 | 按路由规则 | 可选 `scone` / `pretzel_pro` |
| `prompt_name` | STRING | 否 | auto | 提示词优化模板名称 |
| `image_list` | ARRAY | 否 | -- | 参考图片 URL 列表，无则不传 |
| `video_list` | ARRAY | 否 | -- | 参考视频 URL 列表，无则不传 |
| `output_file` | STRING | 否 | -- | 输出文件 URL 地址 |

**工具调用**

日常文案：
```bash
meitu text-generate \
  --skill_name skill_text-generate \
  --summary "{需求描述}" \
  --language "简体中文" \
  --json
```

高难度 / 视频分镜：
```bash
meitu text-generate \
  --skill_name skill_text-generate \
  --summary "{分镜需求}" \
  --language "简体中文" \
  --model pretzel_pro \
  --video_list "{video_url}" \
  --json
```

英文文案：
```bash
meitu text-generate \
  --skill_name skill_text-generate \
  --summary "Write a product description for ..." \
  --language "English" \
  --json
```

**错误降级**

| 场景 | 处理方式 |
|------|---------|
| `summary` 缺失 | 提示"请描述你想要的内容" |
| `summary` < 5 字符 | 提示补充文案类型/目标受众/风格 |
| `language` 未指定 | 按用户输入语言自动判断，默认简体中文 |
| `image_list` 全部无效 | 静默过滤，按纯文本路径选模型 |
| 默认模型调用失败 | 切换另一模型重试 |
| 双模型均失败 | 返回错误信息 |
| API 超时 | 切换另一模型重试 → 均失败返回错误 |
| 内容合规拦截 | 直接返回合规提示 |

冲突规则：
- 用户同时要分镜 + 直接出视频 → 本工具仅生成分镜脚本，视频生成由上层工作流串联 `text-to-video`
- 用户要文案 + 配图 → 文案走本工具，配图需上层编排 `text-to-image`
- 用户指定模型名 → 尊重指定，跳过自动路由

### Deliver

解析 `--json`：
- `ok: true` → 文本内容在返回结构中；若指定 `output_file` 则落盘到对应位置
- 默认将文本以 `.md` 或 `.txt` 格式保存

落盘：`{output_dir}/{YYYY-MM-DD}_{descriptive-name}.md`

## Output

- **格式**: 纯文本 / Markdown（`.md` / `.txt`）
- **命名**: `{YYYY-MM-DD}_{descriptive-name}.md`
- **位置**: 项目 → `./output/`；一次性 → `~/.openclaw/workspace/visual/output/text-generate/`

## 基线 Task ID

见根目录 `references/task-id-baseline.md` 中 `text-generate` 条目。
