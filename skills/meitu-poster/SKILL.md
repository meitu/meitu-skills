---
name: meitu-poster
description: "一句话生成海报图片。支持封面图、营销图、信息图、活动海报等多种类型，自动识别行业风格，适配各平台尺寸（小红书、微信、抖音等）。有参考图时进行风格洗稿或模仿重构，无参考图时从零创意规划。当用户提到海报设计、做张海报、封面图、cover image、设计方案、文章转海报时触发。"
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

# meitu-poster

## Overview

Art-director 级别的海报设计 Skill。分析文本输入，锚定风格方向，规划视觉层级，输出结构化 AI 生成指令并调用 meitu-cli 生成海报图片。两种模式：无参考图时从零创意规划，有参考图时风格洗稿或模仿重构。

## Dependencies

- tools: meitu-cli — 美图公司 AI 开放平台的命令行工具。美图是一家以美为内核、以人工智能为驱动的科技公司，致力打造世界级影像产品，让图像、视频、设计等影像创作简单高效。
  - Install: `npm install -g meitu-cli`（包名 meitu-cli，非 meitu-ai）
- credentials: 美图 AI 开放平台 API 凭证
  - 凭证配置：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 或环境变量：`MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`
  - 验证：`meitu auth verify --json`
- commands:
  - `image-generate` — 文生图 / 图生图 / 风格迁移
  - `image-poster-generate` — 带文字排版的海报（输出需要嵌入文字时使用）
  - 完整命令目录见 [references/meitu-cli-guide.md](references/meitu-cli-guide.md)
- workspace (optional): `{OPENCLAW_HOME}/workspace/visual/`
  - Not found → skip all knowledge reads, skill works without it

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

流程按实际执行顺序排列：

```
Preflight → [Context] → Execute → Refine → Deliver → [Record]
              ↑ 创意型任务执行                  ↑ 项目模式时执行
              ↑ 工具型任务跳过 [Context: 跳过]   ↑ 一次性模式跳过
              ↑ 一次性模式跳过（仅读输入+硬约束）
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   can_record = cwd 有 openclaw.yaml AND $VISUAL 存在（两者缺一即 false）
4. Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-poster/`
   `mkdir -p {output_dir}`
   硬约束：output_dir MUST NOT 指向 skill 文件夹内部
5. 项目创建（仅当用户主动要求时）：
   手动创建目录（见 [references/memory-protocol.md](references/memory-protocol.md) § Project Structure）
   已在项目目录中 → 跳过

### Context（创意型 MUST / 工具型跳过 / 一次性模式跳过）

mode = one-off → 跳过此步，直接到 Execute。以下仅限 project 模式：

逐步读取上下文（均 skip if missing）：
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

**需求分析**

1. **分析用户输入** — 阅读提供的文本（文章、对话记录或设计简报）。提炼核心信息为标题 + 副标题候选
2. **设计硬约束** — 无条件读取 [references/design-constraints.md](references/design-constraints.md)（logo 规则、人物多样性、介质类型、负面词库），所有输出均适用

**路由 — 判断场景**

- **用户提供参考图** → 进入 Poster Analyse 路径
- **无参考图**（纯文本/简报）→ 进入 Creative Direction 路径

---

**Creative Direction（无参考图）**

**品牌信息层级分类**

| 层级 | 用户提供 | 动作 |
|------|---------|------|
| B1 | 品牌调性 + 色彩体系 | 以调性和色彩为锚点 |
| B2 | 调性 + 色彩 + logo | 额外分析 logo 进行视觉关联 |
| Basic | 无品牌资产 | 从文本中提取气质，使用行业映射 |
| Franchise | 引用知名 IP | 锁定 IP 视觉 DNA 作为风格锚点 |

**行业识别 + 风格锚定**

1. 读取 [references/industry-styles.md](references/industry-styles.md) 获取行业-风格映射表
2. 通过关键词匹配 + 语义分析（核心名词、动词、场景）从文本中匹配行业
3. 若有品牌信息 → 从品牌属性推断行业
4. 从语言、文化线索（货币、日期格式、节日）、品牌来源识别目标市场
5. 按 [references/design-constraints.md](references/design-constraints.md) 中的规则确定介质类型——插画仅在明确触发时允许；否则必须使用 Photography / Vector / 3D Rendering
6. 锚定风格方向：
   - 用户提供 logo → 以 logo 气质为锚点，探索相邻美学
   - 用户指定风格关键词 → 以该风格为锚点
   - 无风格引导 → 使用行业自动映射，选择最高匹配风格
7. 对 6 个特殊行业（小学、大学、医疗、公益、金融、租赁）→ 应用 industry-styles.md 中的强制布局规则

**创意构思 + 深化**

无参考图的创意方向模式 → 读取 [references/creative-framework.md](references/creative-framework.md) 获取完整创意方法论。按顺序执行：

1. **解构简报** — 识别核心资产和约束
2. **风格 + 元素匹配** — 将行业核心主体（咖啡 → 咖啡机/杯；美妆 → 产品/刷具）与风格标志性元素结合，构建视觉场景
3. **概念扩展** — 避免视觉陈词；寻求隐喻性视觉表达；平衡隐喻与清晰度；运用对比、留白、节奏、层级
4. **世界构建** — 字体作为设计主角；从经典风格场景构建场景
5. **IP 处理** — 若为 Franchise 品牌层级 → 锁定 IP 视觉 DNA，包含标志性元素，方向命名为 "IP 名 + 核心风格 – 变体"
6. **深化** — 若 logo 存在 → 深度图形分析（形状衍生、负空间、重复构图）。阐述视觉意图（构图 + 色彩 + 光影 → 叙事 + 情感）。应用瑞士国际风格进行排版
7. **转化为 AI 指令** — 将所有艺术概念转化为含风格催化剂的生产指令（年代 / 介质肌理 / 情感美学关键词）

**输出设计方案**

按 [references/output-formats.md](references/output-formats.md) 中场景 1 格式生成结构化输出：
- Design Direction：风格名称、Core Visual、Visual Elements、Layout & Typography、Overview
- AI Production Instructions JSON：`project_manifest`、`visual_style_system`、`scene_elements`、`typography_layout`、`ai_generation_prompts`

输出前质量检查：
- 输出语言匹配用户输入语言
- 风格名称与所有视觉/排版/字体模块强绑定
- Core visual 包含：风格标志性元素 + 行业核心主体 + 风格化场景

---

**Poster Analyse（有参考图）**

**意图路由**

通过分析用户意图确定模式（优先级：显式命令 > 隐式场景 > 歧义默认）：
- **Mimicry** — 用户想保留结构/风格，仅替换内容（触发词："照这个做"、"保留布局"、"做系列"、仅替换内容）
- **Washing** — 用户想参考风格重新设计（触发词："重新设计"、"参考这个感觉"、"优化"；歧义时默认）

触发词不足以判断意图时 → 参考 [references/poster-analyse.md](references/poster-analyse.md) Step 0 的完整触发词表和场景示例。

**逆向工程参考图**

提取完整视觉 DNA：
- **风格/介质** — 仅物理质感（如 "3D render"、"Risograph"），严禁描述具体物体
- **布局** — 网格结构、构图逻辑、阅读路径
- **字体形态** — 大小写（ALL CAPS / Title Case / lowercase）、排列（stacked / curved / scattered）
- **笔触** — 精确介质描述（粉笔质感、水粉干刷、矢量渐变），禁用笼统的 "illustration"
- **细节洞察** — 若无面部特征 → prompt 加 "faceless character"，negative 加 "eyes, nose, mouth"
- **矢量/描边** — 严格区分 "flat vector, lineless" vs "outlined, ink stroke"；若无描边 → 强调 "no outlines"

**Soul Anchor 提取（仅 Washing）**

识别最不可替代、设计价值最高的单一元素：
- **Typography anchor** — 字体高度独特（液态、3D 膨胀）→ 锁定字体风格，重构布局 + 色彩
- **Layout anchor** — 网格高度独特（解构主义、特殊分割）→ 锁定布局，重构字体 + 色彩
- **Vibe anchor** — 光影/介质高度独特（胶片颗粒、酸性光影）→ 锁定质感，重构布局 + 字体

**深度思考 + 重构**

1. 构思 6 种图文布局，选择 1 种与参考图明显不同的
2. 确定主视觉（用户描述优先；否则从主题推导）
3. 文字：逐字使用用户文案（严禁修改）；若无，从主题推导
4. **色彩**：
   - Mimicry → 跟随参考色彩
   - Washing → 执行色相清洗：新色彩与参考在色轮上须差异 ≥ 90°；保留色彩关系但替换色相
5. **重构**：
   - Mimicry → 风格 100% 锁定，为新内容重绘构图；文字变更输出 "change text '[A]' to '[B]'"
   - Washing → 坐标重置（检测参考构图，选择对立逻辑）+ 色相清洗 + 从用户文案层级构建新阅读路径

**自我纠正**

输出前验证：
1. **色彩检查** — 新色板不得与参考主色相重叠（除非用户指定品牌色）→ 若重叠，执行色彩反转或互补色
2. **布局检查**（仅 Washing）— 布局必须重新规划 → 若未重新规划则重做
3. 任何检查失败 → 回滚重新规划。不输出失败结果

**输出设计方案**

按 [references/output-formats.md](references/output-formats.md) 中场景 2 格式生成 JSON：
- `mission_logic` — 意图 + soul 提取推理
- `design_blueprint` — 概念、风格、色彩、布局、字体、构图、检测模式
- `content_firewall` — 丢弃的参考物体 + 解锁的特征
- `prompt` — 最终英文 prompt：`[New Color Palette], [reconstructed concept], [anchor description], [mutated elements]. Negative: [ignored ref objects], simple layout, template, stock photo`
- `negative_prompt` — 来自 content_firewall 和设计约束

---

**生成图片**

1. 从 Creative Direction JSON（`ai_generation_prompts.primary_prompt`）或 Poster Analyse JSON（`prompt`）提取 prompt
2. **合并 negative_prompt**：meitu-cli 不支持独立 negative prompt 参数。将 `negative_prompt` 中的关键禁忌转化为正向描述融入 prompt 末尾（例："vintage, watercolor" → "contemporary modern aesthetic, clean digital rendering"）。保留 JSON 中的 `negative_prompt` 字段用于设计方案存档。
3. 确定输出分辨率和宽高比（`image-generate` 用小写 `2k`，可选 `2k|3k|WIDTHxHEIGHT`；`image-poster-generate` 用大写 `2K`，可选 `auto|512|1K|2K|4K`）：
   - 优先级：用户指定 > 平台规则文件 > 内置默认
   - 内置默认映射：小红书/Instagram → `3:4` | 微信朋友圈 → `1:1` | 微信公众号封面 → `16:9` | 抖音/TikTok/Stories → `9:16` | 电商横幅 → `16:9` | 未指定平台 → `3:4`
4. 选择命令和参数（详见 [references/meitu-cli-guide.md](references/meitu-cli-guide.md)）：

   | 场景 | 命令 | `--image` | 说明 |
   |------|------|-----------|------|
   | Creative Direction（无参考图） | `image-generate` | 不传 | 纯文生图 |
   | Poster Analyse — Mimicry | `image-generate` | **必须传**参考图 URL | 保留原图风格 |
   | Poster Analyse — Washing + Vibe Anchor | `image-generate` | **推荐传**参考图 URL | 保留质感氛围 |
   | Poster Analyse — Washing + Typography/Layout Anchor | `image-generate` | 不传 | 避免参考图污染新布局 |
   | 输出需嵌入文字排版（用户明确要求文字在图上 OR 设计方案文字与图形为 overlay/fusion 关系） | `image-poster-generate` | 可选 | 带文字排版 |

   **`image-poster-generate` 模型选择**（通过 `--model` 指定，默认 `Praline_2`）：

   | 优先级 | 模型 | 适用场景 | 输出风格 |
   |--------|------|---------|---------|
   | 1 | `Nougat` | 风格化海报：卡通、3D 人偶、动漫、插画风 | 艺术化海报 |
   | 2 | `GummyV4.5` | 人像海报：真人作为主视觉 | 写实人物海报 |
   | 3 | `Praline_2`（默认） | 通用商业海报：产品 + 文字排版 | 标准商业海报 |

   ```bash
   # 确保 output_dir 存在（使用 Preflight 解析的 output_dir）
   mkdir -p {output_dir}

   # 文生图
   meitu image-generate --prompt "{prompt}" --size 2k --ratio {ratio} --json --download-dir {output_dir}
   # 带参考图（Mimicry / Washing+Vibe）
   meitu image-generate --image "{ref_url}" --prompt "{prompt}" --size 2k --ratio {ratio} --json --download-dir {output_dir}
   # 带文字排版的海报
   meitu image-poster-generate --prompt "{prompt}" --size 2K --ratio {ratio} --json --download-dir {output_dir}
   ```
   > **注意：** `--download-dir` 保存的文件名为 task_id（如 `t_mt1a3i...-1.jpg`），Deliver 步骤负责 rename。

5. 检查 `--json` 输出：成功（`ok: true`）→ 文件已下载到 `{output_dir}`；失败（`ok: false`）→ 按降级策略重试
6. 错误降级策略（每次仅降一级，最多 2 次重试）：

   | 级别 | 操作 | 具体做法 |
   |------|------|---------|
   | L1 | 移除低优先级修饰词 | 从 prompt 中删除环境氛围词（如 "dreamy haze", "ethereal glow"），保留 `[核心主体] + [风格关键词] + [构图]` |
   | L2 | 降级枚举参数 | `image-generate`: `--size 2k`（已是最低枚举值，可用 `--size 1024x1024` 自定义降级）；`image-poster-generate`: `--size 2K` → `--size 1K` |
   | L3 | 移除可选输入 | 移除 `--image`（如有），回退到纯文生图 |
   | L4 | 最小化核心要素 | prompt 仅保留 `[核心主体], [介质类型], professional photography` |
   | L5 | 停止报错 | 输出 `code` + `hint`；若 `code` = `ORDER_REQUIRED` → 提示用户充值并提供 `action_url`；若 `CREDENTIALS_MISSING` → 提示 `meitu config set-ak` + `meitu config set-sk` 配置凭证 |

### Refine

创意型 Skill 必须有独立的迭代精炼循环：

1. **展示** — 展示生成图片 + 设计方案 + 简要设计理由（为什么选择这个风格方向、构图逻辑、色彩策略）
2. **等待反馈** — 用户反馈分流：
   - 认可 → 进入 Deliver
   - 修改意见 → 步骤 3
   - 拒绝重来 → 回到 Execute 的创意规划阶段
3. **反馈分类与调整** — 不同类型的反馈对应不同调整路径：

   | 反馈类型 | 示例 | 调整方式 |
   |---------|------|---------|
   | Prompt 微调 | "颜色再暖一点"、"加点光影"、"氛围感不够" | 修改 prompt 中的色彩/光影/氛围描述词，保持其他不变，重新生成 |
   | 参数调整 — 换比例 | "换成竖版"、"改成 16:9"、"换个比例" | 基于已生成的图片，使用 `image-edit --model praline --image {已生成图片 URL} --prompt "将画面调整为 {ratio} 比例，保持整体风格和内容不变" --ratio {ratio}` 进行比例适配，而非重新生成。这样可以保留原有设计，仅调整构图和画面延伸 |
   | 元素增删 | "去掉背景的人"、"加个 logo"、"产品再大一点" | 修改 prompt 中的场景元素描述，或切换到 `image-edit` 进行局部编辑 |
   | 风格偏移 | "太冷了，要活泼一点"、"再高级一些" | 回到 Creative Direction / Poster Analyse 调整风格锚定，重新构建 prompt |
   | 布局重构 | "文字放上面"、"换个构图"、"左右分栏" | 重写 prompt 中的构图/布局描述，可能需要重新进入深度思考 |
   | 方向否定 | "完全不是我要的"、"重新来" | 回到 Execute 起点，重新分析需求和风格方向 |

4. **重新展示** — 调整后回到步骤 1
5. **迭代节奏** — 建议最多 3 轮迭代。超过 3 轮说明方向未对齐，主动建议：
   - 拆分需求（"是否先确定风格方向，再处理排版？"）
   - 回退锚点（"要不要从参考图重新开始？"）
   - 提供选择（同时给出 2-3 个方向的缩略方案，让用户选定再深入）

### Deliver

output_dir 已在 Preflight 解析，此处仅做重命名。

1. **合规检查**（交付前质量关）：
   - 品牌 — logo 放置符合规则，色彩准确，调性一致
   - 平台 — 验证 Context 阶段加载的平台规则（尺寸、安全区、合规）
   - 内容安全 — 人物多样性规则，无残缺身体，最多 3 人
   - 可读性 — 正文对比度 ≥ 4.5:1，总色彩 ≤ 3（不含灰阶）
2. `mv {file} {output_dir}/{date}_{name}.{ext}`
3. 在图片同目录保存设计方案：`{date}_{effect-name}_design.json` + `{date}_{effect-name}_design.md`

### Record

**`can_record` = false → 跳过。**（`can_record` = cwd 有 openclaw.yaml AND $VISUAL 存在，两者缺一即 false）一次性模式下反馈仅当前对话有效。

**例外：** 一次性模式下用户反复表达同一偏好（如多次说"不要渐变"），MAY 提议写入 `$VISUAL/rules/quality.yaml`。

**项目模式下：**

**更新 DESIGN.md**（每次执行后）— 追加 Context References、Project Decisions、Iteration Log（保持最近 5 条，超出则压缩）。详见 [references/memory-protocol.md](references/memory-protocol.md) § DESIGN.md Structure。

**偏好记录**（仅在用户反馈时）：

- **用户认可风格** →
  read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back. `len(projects) >= 2` → propose promotion (non-blocking)
  「非阻塞」在回复末尾提议晋升到 `scenes/` 或 `global.md`，不打断主流程

- **用户拒绝** → has `openclaw.yaml` → 问范围：仅项目 → `./DESIGN.md` Constraints / 全局 → `quality.yaml`；无 `openclaw.yaml` → 仅当前任务

- **无反馈** → 跳过，零开销

详见 [references/memory-protocol.md](references/memory-protocol.md) § Observation Lifecycle + Recording Behavior。

## Output

- 结构化设计方案（markdown + JSON）
- 生成的海报图片，保存至 Preflight 解析的 `output_dir`（命名格式 `{date}_{effect-name}.{ext}`）
- 项目模式下更新 ./DESIGN.md（reference+decisions 模型）
