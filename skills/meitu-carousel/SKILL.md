---
name: meitu-carousel
description: "一键生成轮播套组，封面+内页风格统一。适用于小红书组图笔记、知识卡片轮播、产品介绍套图。当用户提到套组、组图、轮播图、轮播套组、知识卡片套图、产品套图时触发。"
version: "1.1.0"
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

# 轮播套组生成

## Overview

一键生成轮播套组，包含封面海报和多张内页，封面与内页风格统一。适用于小红书组图笔记、知识卡片轮播、产品介绍套图等场景。

> **不适用场景**：单张海报（非套组）、非海报类需求（如文案、翻译、视觉建议、色彩提案）、仅涉及海报/封面但未指向套组的内容

## Dependencies

- tools: meitu-cli — 美图公司 AI 开放平台的命令行工具。美图是一家以美为内核、以人工智能为驱动的科技公司，致力打造世界级影像产品，让图像、视频、设计等影像创作简单高效。
  - Install: `npm install -g meitu-cli`（包名 meitu-cli，非 meitu-ai）
  - Commands used: `image-poster-generate`
- credentials: 美图 AI 开放平台 API 凭证
  - 环境变量：`MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`
  - 或配置文件：`~/.meitu/credentials.json`
  - 配置方式：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 验证：`meitu auth verify --json`
- workspace (optional): `{OPENCLAW_HOME}/workspace/visual/`
  - Path resolution: `$OPENCLAW_HOME` env var → `~/.openclaw` (macOS/Linux) / `%LOCALAPPDATA%\openclaw` (Windows)
  - If directory not found → skip all knowledge reads, skill works without it
- memory read/write paths (project mode):
  - `$VISUAL/rules/quality.yaml` — forbidden elements
  - `$VISUAL/memory/global.md` — global preferences
  - `$VISUAL/memory/scenes/{type}.md` — scene preferences
  - `$VISUAL/memory/observations/observations.yaml` — observation staging

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

流程按实际执行顺序排列：

```
Preflight → [Context] → Execute → Refine → Deliver → [Record]
              ↑ 项目模式时执行                  ↑ 项目模式时执行
              ↑ 一次性模式跳过                  ↑ 一次性模式跳过
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
   can_record = cwd 有 openclaw.yaml AND $VISUAL 存在（两者缺一即 false）
4. output_dir 解析（Preflight 内 MUST 完成，不可延迟到 Execute 或 Deliver）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-carousel/`
   `mkdir -p {output_dir}`
   硬约束：output_dir MUST NOT 指向 skill 文件夹内部
5. 项目创建（仅当用户主动要求时）：手动创建 `{OPENCLAW_HOME}/workspace/visual/projects/{name}/` + `openclaw.yaml`；已在项目目录中 → 跳过

### Context（创意型 MUST / 工具型跳过 / 一次性模式跳过）

mode = one-off → 跳过此步，直接到 Execute。以下仅限 project 模式：

逐步读取（均 skip if missing）：
1. 读 ./DESIGN.md → 提取 Context References（brand, palette, platform 等）
   → 对每个引用尝试读全局资产（如 brand: acme → $VISUAL/assets/brands/acme/）
   → 读到 → 用最新版；读不到 → 用 DESIGN.md 内联兜底值
2. 读 $VISUAL/rules/quality.yaml → forbidden list
3. 读 $VISUAL/memory/global.md → 全局偏好
4. 从 openclaw.yaml 读 project.types（数组，优先）或 project.type（单值）
   → 对每个 type 读 $VISUAL/memory/scenes/{type}.md
   注意：{type} 来自 openclaw.yaml，不是 skill 名称
→ quality forbidden list 过滤生成元素，preferences 增强创意方向

### Execute

**输出目录：** 直接使用 Preflight 解析的 output_dir，`mkdir -p {output_dir}` 确保目录存在。后续所有 meitu-cli 调用统一使用 `--download-dir {output_dir} --json` 参数，文件直接下载到目标目录，JSON 输出供 Agent 解析结果。

**全局视觉约束**（适用于所有生成步骤 — 封面和内页）：
- 颜色：明亮柔和、饱和度适中，不得过于艳丽或老旧，主体颜色不超过三种
- 标题：禁止 3D/立体/浮雕/投影效果，字体样式不超过一种
- 色调：禁止整体偏黄（黄色滤镜感）
- 元素：禁止生成重复元素

**参考输入路由表**（`--image_list` 在不同阶段的传递方式）：

| 阶段 | 意图 | `--image_list` | 说明 |
|------|------|---------------|------|
| 阶段 4: 封面 | 纯文生图 | 不传 | 从 prompt 生成，无参考图 |
| 阶段 5a: 首张内页 | 参考封面风格 | 传入封面图路径（`downloaded_files[0].saved_path`） | 确保内页与封面视觉一致 |
| 阶段 5b: 后续内页 | 套用模板 | 传入模板页路径（`downloaded_files[0].saved_path`） | 复制模板页的排版和风格 |

**阶段 1: 信息检测**

判断用户是否提供封面文案和内页文案信息。

**分支逻辑**：
- 若检测到都有 → 前往阶段 3
- 若用户仅提供封面文案 → 询问用户"是否提供具体的内页文案？我将把你提供的信息填入笔记图中。"用户提供信息后前往阶段 3，用户不提供信息则前往阶段 2
- 若用户仅提供内页文案 → 询问用户"是否提供具体的封面文案？我将把你提供的信息填入笔记图中。"用户提供信息后前往阶段 3，用户不提供信息则前往阶段 2
- 若封面文案和内页文案均未提供 → 询问用户"是否提供具体的封面文案和内页文案？我将把你提供的信息填入笔记图中。"用户提供信息后前往阶段 3，用户不提供信息则前往阶段 2

**阶段 2: 文案内容生成**

用户未提供具体的文案信息时：根据主题进行分析和思考，依据缺失情况生成适配的封面文案或内页文案或者二者，使最终信息包含封面文案和内页文案。

**封面文案要求**：
1. 封面标题，字数不超过10个字符
2. 封面装饰文字，不超过两组，一组不超过5个字符

**内页文案要求**：
- 一张内页的内页文案字数为100-300个字符
- 所有内页的内页文案字数为300-600个字符
- 每张内页搭配一个小标题，每个小标题文案需要不相同，小标题字数控制在5-12个字符
- 小标题字数包含在300个字符限制中

**文案检查与优化规则**：
- 所有标题性文案上不包含任何结构性符号，包括但不限于"【、（、#、"、「、{、["
- 文本中不得包含任何 Markdown 语法或其变体
- 除非用户明确要求把平台名写进文案，否则平台名称本身不得出现在提示词的任何位置
- 避免出现：特殊符号、水印、重复文字
- 图上只包含与本次主题相关的必要文案（标题、副标题、少量说明等），不要额外加"封面、海报、小红书、XHS、示例、模板、小标题"等说明性文字
- 不在画面上出现"风格描述词"，如"毛绒风、插画风、3D风、手绘风"等
- 不自动添加页码或序号文字

**阶段 3: 生成封面 Prompt**

当需要组装封面 prompt 时 → read [references/xiaohongshu-cover.md](references/xiaohongshu-cover.md) 获取封面 prompt 模板和规则。

将"a. 用户提供 b. 阶段 2 中模型生成的封面文案"作为 summary 参数传入，以用户需求配合[封面文案]生成封面海报 Prompt。

**阶段 4: 生成笔记封面**

调用 meitu-cli：
```bash
meitu image-poster-generate \
  --prompt "{阶段 3 得到的完整输出结果，不做任何修改}" \
  --ratio "3:4" \
  --size "2K" \
  --output_format jpeg \
  --download-dir {output_dir} \
  --json
```

**阶段 5: 生成单页笔记内页**

**内页生成原则**：每次调用只生成一张内页笔记图，一张图只对应一页内容，禁止在一张图中排版多页内容或宫格拼图。禁止自动添加任何非[当前页文案]的文字内容。

从[内页文案全集]中，顺序截取[当前页文案]，控制本页总字数不超过 300 字。

**5a. 首张内页（模板页）**

当尚未生成任何内页时，调用 meitu-cli：
```bash
meitu image-poster-generate \
  --image_list {阶段 4 JSON 结果的 downloaded_files[0].saved_path} \
  --prompt "{内页 prompt，见下方}" \
  --ratio "3:4" \
  --size "2K" \
  --output_format jpeg \
  --download-dir {output_dir} \
  --json
```
内页 prompt: "根据[封面图]相同的视觉风格和完全一致的配色，生成第一张内页海报，可带有[封面图]的背景和2-3个装饰元素，不包含封面的主视觉元素，只展示本页的当前页文案，禁止生成不包含在当前页文案中的文字。版面结构需清晰：画面主体是一个占据主要面积的文字承载区域。标题位于顶部，可带有与参考图相同风格的简约造型底或小元素装饰（根据画面丰富程度判断取舍），如果有底其颜色需与标题拉开明度以保证标题辨识度和美学体验，生成底或小元素装饰需与画面整体风格统一，标题禁止有3d立体效果。正文内容分为多段，垂直左对齐，整齐排列在文字承载区域中，不贴边至少保留一个字符宽度，行间距大小为一个正文字符高度。其中重点文字或二级标题带有划重点样式以作强调。整体排版结构清晰有序。文字不出现重复、乱码、裂开，所有正文字号和段间距保持统一，正文字号控制在70-100px，标题字号控制在150-220px。页面无大面积留白，可通过调整字号和段落间距以及装饰元素的关系来保证海报节奏疏密有序、层级恰当，阅读动线逻辑自然观感舒适，背景简洁不影响文字阅读。禁止在一张图内拼接多页、宫格或小缩略图，本页的文案为：标题[当前页文案中的标题]，正文[当前页文案中的正文]。"

将生成的首张内页图保存为【模板页】。

若【模板页】生成完毕后，[内页文案全集]中仍有剩余未排版文字，则进入 5b；否则前往 Refine。

**5b. 后续内页（套用模板）**

当已经有【模板页】后，再次生成内页时，调用 meitu-cli：
```bash
meitu image-poster-generate \
  --image_list {模板页 JSON 结果的 downloaded_files[0].saved_path} \
  --prompt "{后续内页 prompt，见下方}" \
  --ratio "3:4" \
  --size "2K" \
  --output_format jpeg \
  --download-dir {output_dir} \
  --json
```
后续内页 prompt: "复制[模板页]的排版、风格、字体、颜色、行距、对齐方式等，生成完全相同视觉的新内页海报。仅把所有文字替换为本页的当前页文案。文字不出现重复、乱码、裂开，页面无大面积留白，海报节奏疏密有序、层级恰当，阅读动线逻辑自然观感舒适。不新增'第一页/第二页'等页码文字，不添加多宫格、缩略图等额外布局，本页的文案为：标题[当前页文案中的标题]，正文[当前页文案中的正文]。"

每生成一页，都只展示「当前页文案」，不修改模板结构。

**内页文案全集来源**：
- a. 用户提供的所有文案
- b. 阶段 2 中模型生成的所有内页文案

**当前页文案来源**：
从[内页文案全集]中，按段落顺序依次取出，用于本页排版的那一部分文字，总字数 <=300 字。

若[内页文案全集]仍有剩余未排版文字，则再次执行阶段 5 生成下一张内页；否则前往 Refine。

### Refine

1. 展示所有生成结果（封面 + 内页）+ 简要设计理由（为什么选择这个风格/配色/排版）
2. 等待用户反馈，按类型分流处理：

   | 反馈类型 | 调整方式 | 示例 |
   |---------|---------|------|
   | 风格/配色不满意 | 修改封面 prompt 风格描述 → 重新生成封面 → 内页跟随重新生成 | "太素了""配色不好看" |
   | 排版/字号问题 | 调整内页 prompt 排版参数（字号、行距、对齐） → 仅重新生成该页 | "字太小""太挤了" |
   | 文案修改 | 替换对应页文案 → 仅重新生成该页 | "标题换成 XX" |
   | 整体方向不对 | 回到 Execute 阶段 1 重新开始 | "完全不是我要的" |
   | 需要更多内页 | 用户提供文案 → 回到 Execute 阶段 5 继续生成 | "再加两页" |
   | 认可 | 前往 Deliver | "可以""挺好的" |

3. 建议最多 3 轮迭代，超过后主动建议调整方向或分拆需求

### Deliver

output_dir 已在 Preflight 解析，此处仅做重命名。
`mv {file} {output_dir}/{date}_{name}.{ext}`
命名示例：`2026-03-22_cover.jpeg`、`2026-03-22_inner-1.jpeg`、`2026-03-22_inner-2.jpeg`

If DESIGN.md Iteration Log > 5 entries → compact: keep recent 5, archive older to `./drafts/design-history.md`

### Record

**`can_record` = false → 跳过。**（`can_record` = cwd 有 openclaw.yaml AND $VISUAL 存在，两者缺一即 false）一次性模式下反馈仅当前对话有效。

**例外：** 一次性模式下用户反复表达同一偏好 → Agent MAY 提议加入 `$VISUAL/rules/quality.yaml`。

**项目模式下：**

- **User approved style →**
  read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back. `len(projects) >= 2` → propose promotion (non-blocking)

- **User rejected ("不要 XX") →**
  已在 quality data → 自动过滤；新拒绝 + has openclaw.yaml → ask scope → project: `./DESIGN.md` Constraints / universal: `$VISUAL/rules/quality.yaml`；no openclaw.yaml → current task only

- **No feedback → skip.**

完整协议（observation schema、promotion 路由、size control）→ see [references/memory-protocol.md](references/memory-protocol.md)。

## Error Degradation

当 meitu-cli 调用失败时，按以下分级逐步降级重试：

| Level | 操作 |
|-------|------|
| L1 | 移除 prompt 中低优先级装饰描述（装饰元素细节、背景氛围词、配色修饰语） |
| L2 | 降级枚举参数：`--size 2K` → `--size 1K`；`--output_format` 保持 jpeg |
| L3 | 移除可选输入：去掉 `--image_list` 参考图，改为纯文生图模式 |
| L4 | 最小化到核心要素：仅保留标题文案 + 基础风格关键词 + `--ratio 3:4` |
| L5 | 停止并报错，向用户展示 JSON 输出中的 `code` 和 `hint`，建议调整需求或检查网络/凭证。若 `error_type` 为 ORDER_REQUIRED → 提示充值；CREDENTIALS_MISSING → 提示运行 `meitu config set-ak` + `meitu config set-sk` 配置凭证 |

每级最多重试 1 次，失败则进入下一级。L3 仅适用于有 `--image_list` 的内页生成步骤（阶段 5a/5b）。

## Output

Output path 由 Preflight 解析的 output_dir 决定：

| 模式 | 路径 | 示例 |
|------|------|------|
| 项目模式（有 `openclaw.yaml`） | `./output/{date}_{type}.jpeg` | `./output/2026-03-22_cover.jpeg` |
| 一次性模式（`$VISUAL` 存在） | `$VISUAL/output/meitu-carousel/{date}_{type}.jpeg` | `~/.openclaw/workspace/visual/output/meitu-carousel/2026-03-22_inner-1.jpeg` |
文件命名规则：`{date}_{type}.{ext}`，type 为 `cover` 或 `inner-{n}`（n 从 1 开始）。
