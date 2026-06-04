---
name: image-transform
description: "图片几何变换/智能构图/尺寸变换（不改画面内容），覆盖旋转/翻转、倍数放大、无损缩小、调整尺寸、智能构图、画布扩展/扩图。当用户提到旋转、翻转、镜像、放大 N 倍、缩小到 xxx、扩图、改成 16:9、竖版改横版、outpaint、智能构图、重新构图、调整尺寸时触发。"
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

# Image Transform

## Overview

对已有图片做几何变换（不改变画面内容）。4 类场景：旋转/翻转（-180°~180°）、等比放大（2/4/8 倍）、无损等比缩小、智能构图/画布扩展/尺寸变换（AI outpainting）。关键区分："放大 N 倍/缩小到 800 宽/扩图/改尺寸"走本工具；"放大到 4K"（分辨率目标）走 image-superres-enhance。

## API Mapping

- 旋转/翻转：`api_v1_layer_flow_edit_rotate`
- 等比放大：`image_upscale_equal_proportion_edit`
- 无损缩小：`image_dldownscaling_edit`
- 智能构图 / 画布扩展 / 尺寸变换：`image_extension_layer_flow_filter`

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
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-transform/`

### Execute

**触发信号 / 路由规则**

核心维度：**操作意图分支**。

| 场景 | 判定关键词 | 路由 |
|------|----------|------|
| 旋转 / 翻转 | 旋转、顺时针、逆时针、翻转、镜像 | `api_v1_layer_flow_edit_rotate` |
| 等比放大（倍数） | 放大 2/4/8 倍、等比放大 | `image_upscale_equal_proportion_edit` |
| 无损缩小 | 缩小到 xxx、无损缩小 | `image_dldownscaling_edit` |
| 智能构图 / 画布扩展 / 改比例 / 尺寸变换 | 扩图、改成 16:9、竖版改横版、outpaint、智能构图、重新构图、调整到指定宽高 | `image_extension_layer_flow_filter` |

路由原则：缩小目标 > 原图 → 自动转 `image_upscale_equal_proportion_edit`；缩小目标 = 原图 → 直接返回原图。

**参数定义**

通用：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | STRING | 是 | 图片地址 |

`api_v1_layer_flow_edit_rotate`：

| 参数 | 类型 | 范围 | 默认 | 说明 |
|------|------|------|------|------|
| `rotate` | NUMBER | -180 ~ 180 | 0 | 旋转角度；超出自动 clamp |
| `flip_x` | BOOLEAN | true/false | false | 水平翻转 |
| `flip_y` | BOOLEAN | true/false | false | 垂直翻转 |

`image_upscale_equal_proportion_edit`：

| 参数 | 类型 | 范围 | 默认 | 说明 |
|------|------|------|------|------|
| `sr_num` | INTEGER | 2 / 4 / 8 | 2 | 放大倍数；非法值取最近合法值（3→2，6→8） |

`image_dldownscaling_edit`：

| 参数 | 类型 | 说明 |
|------|------|------|
| `target_width` | INTEGER | 目标宽度（**像素 px**，禁止传比例数字） |
| `target_height` | INTEGER | 目标高度（**像素 px**，禁止传比例数字） |

- 仅给一边 → 按原图比例计算另一边
- 目标 > 原图 → 自动切 `image_upscale_equal_proportion_edit`
- 目标 = 原图 → 直接返回原图

`image_extension_layer_flow_filter`：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `width` | INTEGER | -- | 目标宽度（**像素 px**，禁止传比例数字） |
| `height` | INTEGER | -- | 目标高度（**像素 px**，禁止传比例数字） |
| `prompt` | STRING | 保持原图风格自然延伸 | 扩展/重构区域 AI 补全描述 |

`width`/`height` **必须绝对像素值**：用户说"16:9"→按原图尺寸计算像素（例：原图 1024×768，16:9 → `width=1024, height=576`）；只说"扩图"无具体值 → 默认按 3:4 比例计算。扩展场景目标 < 原图 → 不调用，提示"目标尺寸需大于原图尺寸"。

**工具调用**

```bash
# 旋转
meitu image-transform --image_url <url> --rotate 90 --json   --skill_name skill_image-transform
```
```bash
# 等比放大
meitu image-transform --image_url <url> --sr_num 4 --json   --skill_name skill_image-transform
```
```bash
# 缩小
meitu image-transform --image_url <url> --target_width 800 --json   --skill_name skill_image-transform 
```
```bash
# 扩图
meitu image-transform --image_url <url> --width 1920 --height 1080 --json   --skill_name skill_image-transform
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `image_url` 缺失 | 提示"请提供需要变换的图片" |
| `image_url` 不可访问 | 直接返回图片链接无效错误，不重试 |
| `rotate` 超出 -180~180 | 自动 clamp |
| `sr_num` 非法 | 取最近合法值 |
| `downscale` 目标 > 原图 | 自动切 `image_upscale_equal_proportion_edit` |
| `downscale` 目标 = 原图 | 不调用，直接返回原图 |
| `downscale` 只给一边 | 按原图比例计算另一边 |
| 扩图目标 < 原图 | 不调用，提示"目标尺寸需大于原图尺寸" |
| 智能构图/尺寸变换缺 width/height 且无法从比例推算 | 提示"请提供目标宽高或目标比例" |
| 任一 API 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试、不降级 |
| 同时要旋转 + 扩图 | 建议分步操作：先旋转再扩图 |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_image-transform.{ext}`

## Output

- **格式**：image
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-transform/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
