---
name: text-to-image
description: "使用 meitu-cli 从文字描述从零生成全新图片（无底图），覆盖通用文生图/多图参考融合与商业级高品质生成。当用户提到生成一张图、画一张、文生图、创作一张图、概念图、宣传图、封面图、营销图、产品场景图、电影截图风格时触发。"
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

# Text To Image（文生图）

## Overview

从文字描述从零生成全新图片（无底图），参考图仅作风格/氛围补充而非内容主体。涵盖 2 类场景：

1. **通用文生图 / 多图参考融合**：创意概念图、插画、风格混搭、快速出图；支持 `image_list` 多图参考融合；发散/多样/速度快的默认通道。
2. **商业级高品质生成**：宣传视觉/封面、电商海报/营销 Banner、产品场景图、文字渲染（信息图/海报文字）、写实/电影截图风格；文本理解深、文字渲染准、高分辨率；**不支持 `image_list`**。

含人物/角色/肖像描述的文生图（人物封面、概念图、插画含人物）由本工具承接。不处理：基于已有图片编辑/修改、参考图驱动的创作（参考图为主要内容来源）、**已提供参考图**的高保真人像/宠物写真/证件照、海报排版设计、风格迁移、视频生成、搜图、画质提升/超分。

## API Mapping

| 场景 | 后端 API |
|------|---------|
| 通用文生图 / 多图参考融合 | `image_gummy_generate` |
| 商业级高品质生成 | `image_praline_create_v2` |
| 商业级兜底 | `image_praline_create_2`（praline_v2 失败时的降级通道，参数兼容）|

model 映射：

- `auto`（默认）/ 不传 → 按路由规则决策
- `gummy` → `image_gummy_generate`
- `praline_pro` → `image_praline_create_v2`
- 指定 model 调用失败时，仍按降级链继续重试

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
3. 确认 registry 含 `text-to-image`
4. 解析 output_dir：`openclaw.yaml` → `./output/`；else → `~/.openclaw/workspace/visual/output/text-to-image/`

### Execute

**触发信号 / 路由规则**

决策顺序：
1. 有 `image_list` → 强制 `image_gummy_generate`（praline 不支持 image_list）
2. 无 `image_list`：商业/宣传/文字渲染/写实电影风 → `image_praline_create_v2`；否则 → `image_gummy_generate`（默认）

| 场景 | 判定关键词 | 路由 |
|------|-----------|------|
| 有参考图（多图融合） | 参考这张图、融合、多图 | `image_gummy_generate` |
| 商业级 / 宣传 / 电商 | 宣传图、封面、电商、营销、Banner、商业级、高品质、产品场景图 | `image_praline_create_v2` |
| 文字渲染 | 带文字、加标题、信息图、海报文字 | `image_praline_create_v2` |
| 写实 / 电影风格 | 写实、真实感、光影质感、电影截图 | `image_praline_create_v2` |
| 创意 / 插画 / 概念 | 画一张、概念图、插画、创意、风格混搭 | `image_gummy_generate` |
| 通用 / 无特殊要求 | 其他 | `image_gummy_generate`（默认）|

**参数定义**

通用参数：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `prompt` | STRING | 是 | -- | -- | 图片描述。缺失 → 追问 |
| `size` | STRING | 否 | 1K / 2K / 4K | 2K | 输出分辨率 |

`image_gummy_generate` 额外参数：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `image_list` | ARRAY[STRING] | 否 | -- | 参考图片 URL 数组，多图融合/风格参考；纯文生图不传 |

`image_praline_create_v2` 额外参数：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `ratio` | STRING | 否 | 1:1 / 2:3 / 3:2 / 3:4 / 4:3 / 4:5 / 5:4 / 9:16 / 16:9 / 21:9 | -- | 输出宽高比；特殊比例需在 `prompt` 结尾写 `Aspect ratio x:y` |

`image_praline_create_2`（兜底）：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `ratio` | STRING | 否 | auto / 1:1 / 2:3 / 3:2 / 3:4 / 4:3 / 4:5 / 5:4 / 9:16 / 16:9 / 21:9 | auto | 输出宽高比 |

说明：`image_list` 与 `ratio` 互斥；`output_format` 由 combo-tool 内部固定为 `jpeg`，不对外暴露。

**工具调用**

创意 / 默认：
```bash
meitu text-to-image \
  --prompt "{image_description}" \
  --size 2K \
  --json --download-dir {output_dir}
```

多图参考融合：
```bash
meitu text-to-image \
  --prompt "{image_description}" \
  --model gummy \
  --image_list "{ref1}" --image_list "{ref2}" \
  --json --download-dir {output_dir}
```

商业级高品质（带比例）：
```bash
meitu text-to-image \
  --prompt "{image_description} Aspect ratio 16:9" \
  --model praline_pro \
  --ratio 16:9 --size 2K \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理方式 |
|------|---------|
| `prompt` 缺失 | 提示"请描述你想生成的图片内容" |
| `size` 非法值 | 回退至 `2K` |
| `image_list` 部分无效 | 静默过滤无效项 |
| `image_list` 全部无效 + 有 `prompt` | 退化为纯文生图，走 `image_gummy_generate` |
| 有参考图但路由到 praline | 强制切 `image_gummy_generate`，告知"商业级模式不支持参考图" |
| `image_praline_create_v2` 失败 | 降级 `image_praline_create_2` 重试 |
| `image_praline_create_2` 失败 | 降级 `image_gummy_generate` 重试 |
| `image_gummy_generate` 失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |

### Deliver

解析 `--json`：
- `ok: true` → `downloaded_files[0].saved_path` 为本地图片
- `ok: false` → 输出 `code` + `hint`

落盘：`mv {file} {output_dir}/{YYYY-MM-DD}_{descriptive-name}.jpg`

## Output

- **格式**: JPEG（combo-tool 内部固定）
- **命名**: `{YYYY-MM-DD}_{descriptive-name}.jpg`
- **位置**: 项目 → `./output/`；一次性 → `~/.openclaw/workspace/visual/output/text-to-image/`

## 基线 Task ID

见根目录 `references/task-id-baseline.md` 中 `text-to-image` 条目。
