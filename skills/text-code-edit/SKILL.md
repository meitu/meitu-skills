---
name: text-code-edit
description: "使用 meitu-cli 对已有 React/TSX/JSX 源码做编辑修改，支持多轮迭代。当用户提到改代码、修改页面、调整样式、换颜色、加按钮、删组件、改布局、改刚才的代码时触发。"
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

# Text Code Edit（代码编辑）

## Overview

对已有 React/TSX/JSX 源码做样式调整、组件修改、交互/布局调整；支持多轮迭代，可自动串联上下文中最近一次 `text-code` 生成的 `code_url`。不处理：从零生成（无已有源码）、非 React/HTML 框架、后端代码、像素级还原。

## API Mapping

| 场景 | 后端 API |
|------|---------|
| React/TSX 源码编辑 | `text_code_edit` |

model 映射：

- `auto`（默认）/ 不传 → 按路由规则决策
- `pretzel_pro` / `pretzel_lite` → 直接指定
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

1. `meitu --version` ≥ 2.0.6
2. `meitu auth verify --json`
3. 确认 registry 含 `text-code-edit`
4. 解析 output_dir：`openclaw.yaml` → `./output/`；else → `~/.openclaw/workspace/visual/output/text-code-edit/`
5. 解析 source_code_url：
   - 用户提供 → 直接用
   - 用户未提供 + 上下文有最近生成的 `code_url` → 自动取上下文
   - 两者都无 → 提示"请提供源码链接"

### Execute

**触发信号 / 路由规则**

| 场景 | 判定关键词 | 路由 |
|------|-----------|------|
| 修改已有源码 | 改代码、调样式、加组件、删组件、换颜色、改布局 | `text_code_edit` |
| 上下文有 code_url | 改刚才的代码 | 自动取上下文 `code_url` |
| 用户说"重新做一个 / 从头开始" | -- | 不属于本工具（走 text-code） |
| 非 React/HTML 源码 | `.py`/`.java` 等 | 返回"仅支持 React/HTML 代码修改" |

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `prompt` | STRING | 是 | -- | -- | 修改描述。缺失 → 追问 |
| `source_code_url` | STRING | 是 | -- | -- | `.tsx`/`.jsx` 源码 URL。缺失时取上下文最近 `code_url`，仍无 → 追问 |
| `model` | ENUM | 否 | auto / pretzel_pro / pretzel_lite | pretzel_pro | 模型选择 |
| `image_list` | ARRAY | 否 | -- | [] | 参考图片 URL 列表 |
| `video_list` | ARRAY | 否 | -- | [] | 参考视频 URL 列表 |
| `prompt_name` | STRING | 否 | -- | -- | 系统提示词名称 |

**工具调用**

基础编辑：
```bash
meitu text-code-edit \
  --skill_name skill_text-code-edit \
  --prompt "{modification_description}" \
  --source_code_url "{code_url}" \
  --json --download-dir {output_dir}
```

带参考图片 + 指定模型：
```bash
meitu text-code-edit \
  --skill_name skill_text-code-edit \
  --prompt "{modification_description}" \
  --source_code_url "{code_url}" \
  --model pretzel_pro \
  --image_list "{ref_url}" \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理方式 |
|------|---------|
| `prompt` 缺失 | 提示"请描述你想修改的内容" |
| `source_code_url` 缺失 + 上下文有 | 自动取上下文 `code_url` |
| `source_code_url` 缺失 + 上下文无 | 提示"请提供源码链接" |
| `model` 非法值 | 回退至 `pretzel_pro` |
| 修改意图模糊 | 提示用户明确修改内容 |
| `source_code_url` 非 React/HTML | 返回"仅支持 React/HTML 代码修改" |
| `source_code_url` 无法访问 | 重试 1 次 → 返回错误 |
| 超时 | 沿 `pretzel_pro → pretzel_lite` 重试 |
| 代码不完整 | 原模型重试 1 次 |
| 内容合规拦截 | 直接返回合规提示 |

### Deliver

解析 `--json`：
- `ok: true` → `downloaded_files[0].saved_path` 为修改后 `.tsx`
- 更新上下文 `code_url` 指向新版本，以便继续多轮迭代

落盘：`mv {file} {output_dir}/{YYYY-MM-DD}_{descriptive-name}_v{n}.tsx`

## Output

- **格式**: `.tsx` / `.jsx` 修改后源码
- **命名**: `{YYYY-MM-DD}_{descriptive-name}_v{n}.tsx`
- **位置**: 项目 → `./output/`；一次性 → `~/.openclaw/workspace/visual/output/text-code-edit/`

## 基线 Task ID

见根目录 `references/task-id-baseline.md` 中 `text-code-edit` 条目。

