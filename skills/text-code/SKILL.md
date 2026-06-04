---
name: text-code
description: "使用 meitu-cli 从零生成 React/TSX 页面代码，支持素材参考与 prompt 扩写。当用户提到生成网页、做页面、写 React 页面、落地页、活动页、数据可视化页面、生成组件时触发。"
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

# Text Code（代码生成）

## Overview

从零生成 React/TSX 页面代码，支持素材参考（图片/视频）与 prompt 扩写。适用于落地页、活动页、数据可视化页面、界面原型、React 组件快速搭建。不处理：修改已有源码、非 React/HTML 框架、后端代码（Python/Java 等）、像素级还原设计稿、复杂后端对接。

## API Mapping

| 场景 | 后端 API |
|------|---------|
| React/TSX 页面代码生成 | `text_code` |

model 映射：

- `auto`（默认）/ 不传 → 按路由规则决策
- `pretzel_pro` / `pretzel_lite` → 直接指定模型
- 模型回退链：`pretzel_pro` → `pretzel_lite`

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令（见根 `CONFIG.md`）
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6，未装则 `npm install -g meitu-cli@latest`
2. `meitu auth verify --json` → 凭证无效走 CONFIG.md SOP
3. 确认本地 `~/.meitu/tool-registry.json` 已包含 `text-code`，否则 `meitu tools update`
4. 解析 output_dir：`openclaw.yaml` → `./output/`；else → `~/.openclaw/workspace/visual/output/text-code/`；`mkdir -p {output_dir}`

### Execute

**触发信号 / 路由规则**

| 场景 | 判定关键词 | 路由 |
|------|-----------|------|
| 从零生成 React 页面 | 做个页面、生成网页、落地页、活动页、数据可视化、生成组件 | `text_code` |
| 简短 prompt + 有 prompt_name | `prompt` < 10 字符 | 自动扩写后调用 |
| 提供 source_code_url + 修改意图 | 改代码、加按钮、调样式 | 不属于本工具（走 text-code-edit） |
| 要求生成非 React/HTML 代码 | 后端、Python、Java | 告知仅支持 React/TSX |

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `prompt` | STRING | 是 | -- | -- | 页面描述，尽量详细。缺失 → 追问 |
| `model` | ENUM | 否 | auto / pretzel_pro / pretzel_lite | pretzel_pro | 模型选择，非法值回退 pretzel_pro |
| `image_list` | ARRAY | 否 | -- | [] | 参考图片 URL 列表，无效项静默过滤 |
| `video_list` | ARRAY | 否 | -- | [] | 参考视频 URL 列表，无效项静默过滤 |
| `prompt_name` | STRING | 否 | -- | -- | 系统提示词名称 |

**工具调用**

基础生成：
```bash
meitu text-code --prompt "{page_description}" --json --download-dir {output_dir}  --skill_name skill_text-code
```

指定模型 + 参考素材：
```bash
meitu text-code \
  --skill_name skill_text-code \
  --prompt "{page_description}" \
  --model pretzel_pro \
  --image_list "{url1}" --image_list "{url2}" \
  --json --download-dir {output_dir}
```

简短 prompt + prompt_name（自动扩写）：
```bash
meitu text-code --prompt "做个页面" --prompt_name "{template_name}" --json --download-dir {output_dir} --skill_name skill_text-code
```

**错误降级**

| 场景 | 处理方式 |
|------|---------|
| `prompt` 缺失 | 提示"请描述你想生成的网页" |
| `prompt` < 10 字符 + 有 `prompt_name` | 自动扩写 |
| `prompt` < 10 字符 + 无 `prompt_name` | 原样传入 |
| `model` 非法值 | 回退至 `pretzel_pro` |
| `image_list` 全部无效但用户有参考意图 | 提示"请提供有效的图片链接" |
| 请求非 React/HTML 代码 | 告知仅支持 React/TSX |
| 超时 | 沿 `pretzel_pro → pretzel_lite` 重试，链尽返回错误 |
| 代码不完整 | 原模型重试 1 次 → 返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |

### Deliver

解析 `--json`：
- `ok: true` → `downloaded_files[0].saved_path` 为本地 `.tsx` 源码；或 `media_urls[0]` 为 code_url
- `ok: false` → 输出 `code` + `hint`

落盘：`mv {file} {output_dir}/{YYYY-MM-DD}_{descriptive-name}.tsx`，记录 `code_url` 以便后续 `text-code-edit` 自动引用。

## Output

- **格式**: `.tsx` / `.jsx` 源码文件
- **命名**: `{YYYY-MM-DD}_{descriptive-name}.tsx`
- **位置**: 由 Deliver 步骤决定（项目 → `./output/`，一次性 → `~/.openclaw/workspace/visual/output/text-code/`）

## 基线 Task ID

见根目录 `references/task-id-baseline.md` 中 `text-code` 条目。
