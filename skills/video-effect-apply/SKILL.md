---
name: video-effect-apply
description: "使用 meitu-cli 给视频或图片施加创意处理：预设风格特效（视频输入）、AI 创意效果（图片输入）、长视频风格转绘（动漫/像素/黏土等）。当用户提到视频特效、加特效、创意玩法、预设风格、AI 创意视频、风格转绘、变成动漫风格、像素风格视频、黏土风格时触发。"
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

# Video Effect Apply

## Overview

对**已有视频或图片**施加整体视觉风格变换或创意特效（不修改/替换/消除具体内容元素），覆盖 3 类场景 + 2 个兜底：

1. **预设风格特效（视频输入）**：通用默认入口，Agent 根据 `prompt` 在预设特效库中检索可用 `effect_id`。
2. **AI 创意效果（仅图片输入）**：`image_url` + 无 `video_url`，基于图片生成 AI 创意视频。
3. **长视频风格转绘**：动漫/像素/黏土等整体风格转换。

不处理：视频内容替换、视频消除、视频画质修复、视频画布扩展、纯文字生成视频、视频拼接。

## API Mapping

| 场景 | API name | 必需输入 |
|---|---|---|
| 预设风格特效（视频） | `formula_group_v2v_creative` | `video_url` |
| AI 创意效果（图片） | `formula_group_video_creative` | `image_url`（无视频） |
| 长视频风格转绘 | `aiflow_long_video_redrawn` | `video_url` |
| 兜底（v2v，视频输入） | `video_molasses_edit` | `video_url` |
| 兜底（视频特效，图片输入） | `video_bonbon_img2vid_v30` | `image_url` |

`model` 映射：`auto`（默认，按路由规则）/ `molasses` → `video_molasses_edit` / `bonbon` → `video_bonbon_img2vid_v30`。

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> **路径别名：** `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` 与 `meitu auth verify --json`
2. 检测 `MEITU_OPENAPI_TOOL_TASK_MODE=command`
3. output_dir：项目 → `./output/`；一次性 → `$VISUAL/output/video-effect-apply/`；`mkdir -p`

### Execute

**触发信号与路由**

核心判断维度：**输入类型（图片 vs 视频） + prompt 信号词 → effect 分发**。

决策顺序：

1. **输入类型判断（路由铁律）**：
   - 仅图片输入（无 `video_url`）→ **强制走** `formula_group_video_creative`（检索不到时兜底至 `video_bonbon_img2vid_v30`）
   - 有视频输入 → 继续按 prompt 信号词分发

2. **视频输入路由**：
   - 工具内部根据 `prompt` 检索预设特效库
     - 检索到可用 `effect_id` → `formula_group_v2v_creative`
     - 未检索到 → 进入信号词判断
   - 信号词判断：
     - 动漫 / 像素 / 黏土 / 风格转绘 → `aiflow_long_video_redrawn`
     - 通用 / 不明确 → 兜底 `video_molasses_edit`

**3 API 路由速查**

| API | 必需输入 | 触发关键词 |
|---|---|---|
| `formula_group_v2v_creative` | `video_url` | 加特效、预设风格、创意玩法 |
| `formula_group_video_creative` | **`image_url` 无视频**（铁律）| AI 创意视频 |
| `aiflow_long_video_redrawn` | `video_url` | 风格转绘、动漫、像素、黏土 |

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|---|---|---|---|---|---|
| `video_url` | STRING | 条件必填 | — | — | `v2v_creative` / `long_video_redrawn` 必需 |
| `image_url` | STRING | 条件必填 | — | — | `video_creative` 必需 |
| `prompt` | STRING | 是 | — | — | 用户所需特效/风格描述，工具内部据此检索匹配 `effect_id` |
| `model` | STRING | 否 | `auto`/`molasses`/`bonbon` | `auto` | 模型选择 |

说明：`effect_id` **不作为外部入参**，由工具内部根据 `prompt` 自动检索。

**工具调用**

```bash
# 视频输入
meitu video-effect-apply --video_url {url} --prompt "{特效描述}" --json --download-dir {output_dir} --skill_name skill_video-effect-apply
```

```bash
# 图片输入（铁律）
meitu video-effect-apply --image_url {url} --prompt "{特效描述}" --json --download-dir {output_dir} --skill_name skill_video-effect-apply
```

```bash
# 显式指定 model
meitu video-effect-apply --video_url {url} --prompt "..." --model molasses --json --skill_name skill_video-effect-apply ...
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 和 `image_url` 都缺失 | 提示"请提供图片或视频" |
| 要"AI 创意视频"但未提供图片 | 提示"请提供图片" |
| 要"预设特效"但未提供视频 | 提示"请提供视频链接" |
| `video_url` / `image_url` 不可访问 | 不重试，提示"请提供有效链接" |
| 视频输入检索 `effect_id` 无匹配 | 兜底 `video_molasses_edit` |
| 图片输入检索 `effect_id` 无匹配 | 兜底 `video_bonbon_img2vid_v30` |
| `formula_group_v2v_creative` 失败 | 重试 1 次，仍失败走兜底 `video_molasses_edit` |
| `formula_group_video_creative` 失败 | 重试 1 次，仍失败走兜底 `video_bonbon_img2vid_v30` |
| "风格转绘"但视频 <3s | 正常调用，告知短视频效果可能不理想 |
| 任一 API 失败 / 超时 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

`mv {file} {output_dir}/{date}_{name}_effect-apply.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_effect-apply.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-effect-apply/`

## 基线 Task ID

`t_mt1a3i5n7ba09180a6-3aef-4a4d-8acf-53b2fbb033f4`
