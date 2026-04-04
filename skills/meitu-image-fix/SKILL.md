---
name: meitu-image-fix
description: "自动诊断图片的画质、人像、内容问题，按最优顺序串联 image-upscale/beauty-enhance/image-edit/cutout 修复。当用户说修图、变清晰、去水印、去路人、磨皮美颜、修一下这张图、图片模糊、老照片修复时触发。"
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

# Meitu Image Fix

## Overview

接收一张有问题的图片，自动诊断画质/人像/内容三类问题，规划最优修复管线，按顺序调用 meitu-cli 工具链完成修复。核心价值是**诊断+串联**——用户不需要知道该用哪个工具，只需要说"帮我修一下"。

## Dependencies

- **meitu-cli** (>=0.1.9): `npm install -g meitu-cli`
- **凭证**: `meitu config set-ak` / `meitu config set-sk`，或 env `MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context: 跳过] → Execute (诊断 → 规划 → 逐步执行) → Deliver
              ↑ 工具型 skill，无创意上下文需求，始终跳过 Context
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   can_record = cwd 有 openclaw.yaml AND $VISUAL 存在（两者缺一即 false）
4. Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-image-fix/`
   `mkdir -p {output_dir}`

### Context

工具型 skill，无创意上下文需求，始终跳过 Context，直接到 Execute。

### Execute

**诊断：看图 + 听用户**

从两个信息源判断问题：

**视觉分析**（用 Read 工具读取图片，多模态识别问题）：

| 观察到的现象 | 标记 |
|------------|------|
| 分辨率低 / 明显模糊 / 压缩锯齿 / 噪点多 | `quality:blur` |
| 可见水印 / 半透明文字叠印 | `content:watermark` |
| 画面中有不属于主体的路人/杂物 | `content:unwanted-object` |
| 文字内容有错别字 | `content:text-error` |
| 背景有瑕疵（杂乱/破损/穿帮） | `content:bg-flaw` |
| 人脸可见 + 肤质粗糙/暗沉/痘印明显 | `portrait:skin` |
| 人脸可见 + 五官可优化 | `portrait:feature` |

**用户意图解析**（用户说的话直接映射到标签）：

| 用户表述 | 标记 |
|---------|------|
| "变清晰""超清""高清""模糊""画质差""老照片" | `quality:blur` |
| "去水印""水印" | `content:watermark` |
| "去掉路人""去杂物""消除 XX" | `content:unwanted-object` |
| "改文字""改错字""把 X 改成 Y" | `content:text-error` |
| "背景修干净""背景杂乱" | `content:bg-flaw` |
| "磨皮""美颜""祛痘""提亮""皮肤" | `portrait:skin` |
| "变精致""五官调整" | `portrait:feature` |
| "去背景""抠图""透明背景" | `cutout` |
| "修一下""帮我处理一下"（模糊指令） | 完全依赖视觉分析 |

合并两个信息源，得到最终问题列表。

**规划修复管线**

**执行顺序（硬约束——顺序错误会严重影响效果）：**

```
Phase 1: image-upscale         先提升画质，后续操作在清晰图上效果更好
Phase 2: image-edit / cutout   内容修复在高清底图上精度更高
Phase 3: beauty-enhance        美颜放最后，避免被前面步骤的重编码破坏
```

**管线路由表：**

| 问题标签 | Phase | 工具 | 命令 |
|---------|-------|------|------|
| `quality:blur` | 1 | image-upscale | `meitu image-upscale` |
| `content:watermark` | 2 | image-edit | `meitu image-edit --model praline` |
| `content:unwanted-object` | 2 | image-edit | `meitu image-edit --model praline` |
| `content:text-error` | 2 | image-edit | `meitu image-edit --model praline` |
| `content:bg-flaw` | 2 | image-edit | `meitu image-edit --model praline` |
| `cutout` | 2 | image-cutout | `meitu image-cutout` |
| `portrait:skin` | 3 | beauty-enhance | `meitu image-beauty-enhance` |
| `portrait:feature` | 3 | beauty-enhance | `meitu image-beauty-enhance` |

Phase 2 内有多个 edit 操作时，逐条串行执行（每条用上一步输出的 URL）。
cutout 与其他 Phase 2 操作共存时：先 edit 再 cutout（去背景应在内容修好之后）。

**向用户确认管线**（多步修复时）：

列出诊断结果和计划步骤，获得确认后再执行：
> 诊断结果：图片模糊 + 有水印 + 人脸肤质粗糙
> 修复计划：① 超清 → ② 去水印 → ③ 自然美颜
> 确认开始？

用户只提了单一问题且诊断无歧义 → 跳过确认，直接执行。

**逐步执行**

**链式调用机制：**
每步加 `--json`，解析返回 JSON 的 `media_urls[0]` 作为下一步的 `--image` 输入。仅最后一步加 `--download-dir {output_dir}` 保存到本地。加了 `--download-dir` 后，JSON 输出会多一个 `downloaded_files` 数组，直接取 `downloaded_files[0].saved_path` 获取下载文件的完整路径，Deliver 阶段再 rename。

**URL 传递 fallback**：如果下一步用 `media_urls[0]` 作为 `--image` 失败（`UPLOAD_ERROR`），先下载到系统临时目录再用本地路径重试：
```bash
curl -sL -o /tmp/meitu-fix-step{N}.{ext} {url}
meitu <command> --image /tmp/meitu-fix-step{N}.{ext} ...
```
中间文件**必须**存放在 `/tmp/` 或系统临时目录，**禁止**存入 skill 文件夹或源文件所在目录。管线完成后清理：`rm -f /tmp/meitu-fix-step*.{ext}`。

---

**Phase 1: 超清 — image-upscale**

根据图片主体选择 model_type：

| 主体类型 | --model_type | 判断依据 |
|---------|-------------|---------|
| 人像为主 | 0 | 人脸是视觉焦点 |
| 商品/物品 | 1 | 产品、食物、实物特写 |
| 图形/截图 | 2 | UI 截图、文字图、插画、图标 |
| 不确定 | 省略 | 让服务端自动检测 |

```bash
meitu image-upscale --image {input} --model_type {type} --json
```

解析：`ok: true` → `media_urls[0]` 传入下一步。
`ok: false` → 记录错误，**用原图继续**后续步骤（upscale 失败不阻塞管线）。

---

**Phase 2: 内容修复 — image-edit / image-cutout**

每个 content 问题对应一条 edit 指令，逐条串行：

| 问题 | --prompt 示例 | 注意 |
|------|-------------|------|
| 水印 | `"去除图片中的水印"` | 水印面积大可能需要 2 轮 |
| 路人/杂物 | `"消除画面中的路人"` / `"去掉右下角的杂物"` | 描述具体位置效果更好 |
| 文字错误 | `"将文字'XXX'改为'YYY'"` | 指明原文和改后文 |
| 背景瑕疵 | `"修复背景中的破损区域"` | 描述具体区域 |

```bash
meitu image-edit --image {prev_url} --prompt "{instruction}" --model praline --json
```

每步取 `media_urls[0]` 传给下一步。

如果问题是去背景（cutout）：

```bash
meitu image-cutout --image {prev_url} --json
```

---

**Phase 3: 美颜 — image-beauty-enhance**

```bash
meitu image-beauty-enhance --image {prev_url} --beatify_type {type} --json
```

| 用户诉求 | --beatify_type |
|---------|---------------|
| 自然修饰 / 轻微瑕疵 / 日常照 | 0（自然） |
| 明确要求强效 / 瑕疵严重 / 商业用途 | 1（强效） |
| 未明确说明 | 默认 0 |

**约束**：beauty-enhance **仅支持真实单人肖像**。以下情况跳过此步骤并告知用户：
- 多人图片
- 非真实人像（卡通、插画、简笔画、AI 绘图风格）
- 人脸过小或不清晰

服务端拒绝时返回 `CONTENT_REQUIREMENTS_UNMET`（code 98501），直接跳过即可。

同时有 `portrait:skin` 和 `portrait:feature` → 一次 beauty-enhance 即可覆盖（不需要调两次）。

---

**最后一步下载：** 管线最后一个命令加 `--download-dir {output_dir}`，直接保存结果文件到本地。

**错误处理**

每步独立处理，单步失败不阻塞管线：

```
L1: 简化 prompt — 移除修饰语，保留核心指令（edit 步骤适用）
L2: 省略可选参数 — 如 model_type 让服务端自动判断
L3: 跳过当前步骤 — 用上一步结果继续后续管线
L4: 连续 2 步失败 → 停止管线，将最后一个成功步骤的结果下载到 {output_dir} 交付，并说明哪些步骤未完成
L5: 首步即失败 → 检查凭证/余额，报错含 code + hint
```

特殊错误码：
- `ORDER_REQUIRED` → 提示用户充值，提供 action_url
- `CREDENTIALS_MISSING` → 提示配置 AK/SK

### Deliver

output_dir 已在 Preflight 预解析，Execute 最后一步的 `--download-dir` 已直接写入该目录，Deliver 仅做 rename。

`mv {output_dir}/{task_id_file} {output_dir}/{date}_{effect}.{ext}`

### Record（项目模式 MUST / 一次性模式跳过）

can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）→ false 时跳过。一次性模式下反馈仅当前对话有效。

User approved style →
  read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back. `len(projects) >= 2` → propose promotion (non-blocking)
  → 非阻塞提议晋升（在回复末尾提及："你在 N 个项目中都偏好 X，要保存吗？"）→ confirmed → write target + delete observation

User rejected ("不要 XX") →
  has openclaw.yaml → ask scope → project: DESIGN.md Constraints / universal: quality.yaml（需用户确认）
  no openclaw.yaml → current task only

No feedback → skip entirely（不读 observations.yaml，zero overhead）。

## Output

- **格式**：与输入一致（jpg→jpg, png→png），cutout 输出 png（含透明通道）
- **命名**：`{date}_{修复摘要}.{ext}`
  - 单一修复：`2026-03-23_upscale.jpg`
  - 串联修复：`2026-03-23_upscale+remove-watermark+beauty.jpg`
- **位置**：由 Deliver 步骤决定

## Boundaries

本 skill 只做**修复**——让一张已有的图变得更好。不做创作类任务：

| 不做 | 转交 |
|------|------|
| 风格转绘（变漫画/油画/3D） | `meitu-stylize` |
| 换背景/换场景（创意替换） | `meitu-product-swap` |
| 海报排版/加文字布局 | `meitu-poster` |
| AI 写真/人像生成 | `meitu-portrait` |

**边界判断**：用户意图是"修好这张图的问题" → 本 skill。用户意图是"把这张图变成另一种东西" → 告知用户并建议对应 skill。
