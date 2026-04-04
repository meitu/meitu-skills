---
name: meitu-image-adapt
description: "将任意图片智能适配到目标比例，自动重构构图逻辑，保持主体比例不变形、内容完整不丢失，背景自然延展无接缝。当用户提到图片适配、图片延展、图片扩展、外扩、outpaint、将竖图变横图、适配小红书/抖音/公众号尺寸时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY"],"paths":{"read":["~/.meitu/credentials.json","~/.openclaw/workspace/visual/"],"write":["~/.openclaw/workspace/visual/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
requirements:
  credentials:
    - name: MEITU_OPENAPI_ACCESS_KEY
      source: env | ~/.meitu/credentials.json
    - name: MEITU_OPENAPI_SECRET_KEY
      source: env | ~/.meitu/credentials.json
  permissions:
    - type: file_read
      paths:
        - ~/.meitu/credentials.json
        - ~/.openclaw/workspace/visual/
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
    - type: exec
      commands:
        - meitu
---

## Overview

将用户提供的图片智能适配到目标宽高（像素），主体保持不变形，背景自然延展无接缝。核心工具为 `meitu image-adapt`。

## Dependencies

- **meitu-cli**: `npm install -g meitu-cli`
  - 凭证配置: `meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 验证: `meitu auth verify --json`

> **路径别名:** `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

---

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则提示配置 AK/SK
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
4. Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-image-adapt/`
   `mkdir -p {output_dir}`

### Execute

**1. 收集输入**

| 输入 | 说明 | 必填 | 默认值 |
|------|------|------|--------|
| **image** | 待适配的原图 | 是 | — |
| **width** | 目标宽度（像素） | 是 | 1080 |
| **height** | 目标高度（像素） | 是 | 1920 |

**image 接受格式：** URL 或本地路径 (.jpg/.jpeg/.png/.webp)

**2. 目标尺寸解析**

用户可能直接给像素值，也可能说平台名或比例。按以下优先级解析：

**A. 用户给了明确像素** → 直接使用。

**B. 用户给了平台名** → 查 [references/platform-presets.md](references/platform-presets.md) 获取推荐尺寸。

常用速查（完整表见 references）：

| 平台 | 场景 | width × height |
|------|------|----------------|
| 小红书 | 竖版笔记封面 | 1080 × 1440 |
| 抖音 | 竖版视频封面 | 1080 × 1920 |
| 微信公众号 | 文章头图 | 900 × 383 |
| 微信朋友圈 | 正方形 | 1080 × 1080 |
| B站 | 视频封面 | 1920 × 1080 |
| 淘宝 | 商品主图 | 800 × 800 |

若平台有多个场景，列出选项让用户选择。

**C. 用户给了比例（如 16:9）** → 保证输出覆盖原图所有像素（不裁切），取能包含原图的最小目标尺寸：
- 对目标比例 W:H，分别计算两种方案：① 以原图宽度为基准算高度；② 以原图高度为基准算宽度。取两者中输出面积更大的方案（即确保两边都 ≥ 原图）。
- 例：原图 1080×1440，目标 16:9 → 方案① width=1080, height=608（高度缩小，丢内容）；方案② width=2560, height=1440（宽度延展，保全内容）→ 取方案② = 2560×1440
- 例：原图 1080×1440，目标 1:1 → width=1440, height=1440（以长边为基准，短边延展）

**D. 用户未指定** → 默认 1080×1920（竖版全屏），并告知用户可调整。

**3. 输入预检**

调用前检查，避免浪费额度：

- **原图可访问** — URL 能打开 / 本地路径存在
- **目标尺寸合理** — width 和 height 均在 100-8192 范围内
- **非无意义操作** — 目标尺寸与原图尺寸差异 ≥5%（几乎相同则提醒用户确认）
- **延展比例合理** — 单方向延展不超过原图 4 倍（如 500px 延展到 2000px 以上），超出则警告质量可能下降

**4. 调用 meitu-cli**

```bash
meitu image-adapt \
  --image "{image}" \
  --width {width} \
  --height {height} \
  --json \
  --download-dir "{output_dir}"
```

**返回处理：**
- `ok: true` → `downloaded_files[0].saved_path` 获取本地路径
- `ok: false` → 检查 `error_type`、`code`、`hint`

**5. 错误降级策略**

| 级别 | 操作 | 说明 |
|------|------|------|
| L1 | 调整目标尺寸到最近的标准比例 | 非标尺寸可能导致异常，尝试最接近的标准比例（16:9, 9:16, 4:3, 3:4, 1:1） |
| L2 | 缩小目标尺寸 | 保持比例不变，将长边缩小到 2048px 以内重试 |
| L3 | 分步适配 | 若单次延展幅度过大，拆成两步：先适配到中间尺寸，再从中间尺寸适配到目标 |
| L4 | 停止并报错 | 连续 2 次失败 → 报告 error code 和 hint，不再重试 |

**常见错误码：**
- `ORDER_REQUIRED` → 余额不足，告知用户充值，提供 action_url
- `CREDENTIALS_MISSING` → AK/SK 未配置，引导 `meitu config set-ak/set-sk`
- `INVALID_IMAGE` → 图片无法读取，检查 URL 可访问性或文件格式

### Deliver

`mv {file} {output_dir}/{date}_{name}.{ext}`

**命名规范：** `{date}_{描述性名称}.{ext}`
- `{date}` = `YYYY-MM-DD`（如 `2026-03-23`）
- `{name}` = 简洁描述适配操作（如 `adapt-1080x1920`、`adapt-xiaohongshu`）
- `{ext}` 取自下载文件的实际扩展名，不硬编码

路径展示用 `~/` 格式。

**示例：** `~/…/output/meitu-image-adapt/2026-03-23_adapt-xiaohongshu-cover.png`

---

## Output

| 属性 | 值 |
|------|-----|
| 格式 | 与原图一致（PNG/JPEG/WEBP） |
| 命名 | `{date}_{effect-name}.{ext}` |
| 尺寸 | 用户指定的 width × height |
| 路径 | 由 Deliver 步骤确定 |
| 特征 | 主体比例不变形、内容完整不丢失、背景自然延展无接缝 |
