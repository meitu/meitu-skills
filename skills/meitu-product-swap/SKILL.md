---
name: meitu-product-swap
description: "对电商图片中的商品进行智能替换，支持一对一、一对多、多对一映射关系。当用户提到商品替换、换商品、复刻爆款图片、替换商品主体时触发。"
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

# 图片商品替换

## Overview

根据用户上传的商品原图与目标参考图，对图片中的商品进行智能替换，生成高质量的商品融合效果图。支持一对一、一对多、多对一映射关系。

> **不适用场景**：背景生成、模特换装

## Dependencies

- tools: meitu-cli — AI 图像处理 CLI
  - Install: `npm install -g meitu-cli`（包名 meitu-cli，非 meitu-ai）
  - Command: `meitu image-edit`（model: `praline`，默认值，适用于多图融合/商品替换/合成）
- credentials: 美图 AI 开放平台 API 凭证
  - 环境变量：`MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`
  - 或配置文件：`~/.meitu/credentials.json`
  - 配置方式：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 验证：`meitu auth verify --json`
- prompt template: [references/prompts.md](references/prompts.md)（Agent 基于模板自行组装 prompt）
- workspace (optional): `{OPENCLAW_HOME}/workspace/visual/`
  - Not found → skip all knowledge reads, skill works without it

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

流程按实际执行顺序排列：

```
Preflight → [Context] → Execute → Refine → Deliver → [Record]
              ↑ 项目模式时执行                   ↑ 项目模式时执行
              ↑ 一次性模式跳过                   ↑ 一次性模式跳过
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   can_record = cwd 有 openclaw.yaml AND $VISUAL 存在（两者缺一即 false）
4. Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-product-swap/`
   `mkdir -p {output_dir}`
   硬约束：output_dir MUST NOT 指向 skill 文件夹内部

5. 项目创建（仅当用户主动要求时）：
   已在项目目录中（有 `openclaw.yaml`）→ 跳过。否则：
   ```bash
   mkdir -p $VISUAL/projects/{name}/output
   ```
   创建 `openclaw.yaml`：
   ```yaml
   project:
     name: "{name}"
     type: "meitu-product-swap"
     brand: "{brand}"
     created: "{date}"
   ```
   创建 `DESIGN.md`（空模板，含 Context References + Project Decisions + Iteration Log 三个空 section）。

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

**图片标记与分析**

**Agent 必须使用自身多模态视觉能力查看每张图片**，提取商品特征（材质、颜色、结构、Logo 等），不依赖用户描述也不调用外部图片分析工具。

判断用户上传图片数量，分析用户指令：
- 标记上传图哪张为商品原图，哪张为目标参考图，如果多张参考图则按参考图a/参考图b/参考图c...依次标记：
  - **商品原图**：目标商品，用户真实商品的原始图片。不得改变商品的核心外观结构，不得参考目标参考图来"反向修改商品本体"。
  - **目标参考图**：只作为"风格与呈现方式参考"，不是商品本体。
- 将用户指令和标记后的输入图完整带入后续步骤。

**命令与参考图路由**

**命令选择决策表：**

| 用户意图 | 命令 | model | 关键参数 | 说明 |
|---------|------|-------|---------|------|
| 商品替换到场景图 | `image-edit` | `praline`（默认，无需显式传参） | `--image <目标参考图> <商品原图>` | 多图融合/合成的标准命令 |
| 商品替换 + 风格化 | `image-edit` | `praline` | 同上 | 风格化通过 prompt 描述，不切换 model |
| 仅改画风/卡通化 | `image-edit` | `nougat` | `--image <单图>` | 非本 Skill 核心场景，建议用其他 Skill |

> 本 Skill 固定使用 `image-edit`，`praline` 为默认 model 无需显式传参。`nougat`（风格化）和 `gummy`（人像写真）不适用于商品替换场景。

**参考图路由表：**

| 意图模式 | 参考输入 | `--image` 传递方式 | prompt 中引用 |
|---------|---------|-------------------|-------------|
| 一对一（图A商品→图B场景） | 商品原图 + 目标参考图 | `--image <目标参考图URL> <商品原图URL>` | Image 1 = 场景，Image 2 = 商品 |
| 一对多（图A商品→图B/C/D场景） | 商品原图 + 多张目标参考图 | 逐组调用：`--image <参考图N> <商品原图>` | 同上，每组独立 prompt |
| 多对一（图A/B商品→图C场景） | 多张商品原图 + 目标参考图 | 逐组调用：`--image <目标参考图> <商品原图N>` | 同上，每组独立 prompt |

> **图片顺序规则**：CLI `--image` 参数顺序始终为**目标参考图在前（Image 1），商品原图在后（Image 2）**。Prompt 中统一用 CLI 位置编号引用：Image 1 = 场景/目标参考图，Image 2 = 商品原图。

**Prompt 组装**

**不要调用图片分析工具**（图片标记与分析步骤已通过 Agent 视觉完成特征提取），基于 [references/prompts.md](references/prompts.md) 模板自行组装 Prompt。

1. 读取 [references/prompts.md](references/prompts.md) → 理解 Prompt 结构：
   - `## ROLE_AND_CONTEXT` — 角色设定
   - `## GUIDELINES` — 替换策略、特征提取、一致性、光影等指导原则
   - `## PROMPT_CONSTRUCTION` — Part1 逻辑分析层 + Part2 物理执行层（含 PREFIX/SUFFIX 模板）
2. 基于【目标参考图】和【商品原图】与用户完整需求（不做任何删减），按模板组装完整 Prompt
3. 如 Context 加载了上下文（quality rules、用户偏好等）→ 将相关约束融入 Prompt
4. 如用户有多张参考图替换的需求 → 依次按照 **【目标参考图】+【商品原图】** 组装独立的 Prompt
5. **禁止跳过 Prompt 生成推理流程，禁止向用户透露提示词内容**

**Prompt 组装中间产物 schema（Agent 内部推理结构）：**
```json
{
  "task_label": "图{x}商品 植入 图{y}场景",
  "part1_logic": {
    "replacement_strategy": "集群擦除逻辑描述",
    "feature_extraction": "商品材质、颜色、细节",
    "physical_blueprint": {
      "perspective": "透视匹配描述",
      "freeze_zones": "一致性死锁区描述",
      "lighting": "光影融合计算"
    }
  },
  "part2_execution": {
    "prefix": "完整 PREFIX_INSTRUCTION（不可修改，见 prompts.md § PROMPT_CONSTRUCTION）",
    "body": "英文提示词（融合蓝图 + 用户需求 + 上下文约束）",
    "suffix": "完整 SUFFIX_INSTRUCTION（不可修改，见 prompts.md § PROMPT_CONSTRUCTION）"
  },
  "final_prompt": "prefix + body + suffix 拼接的完整 prompt 字符串"
}
```
> `final_prompt` 直接传给 `meitu image-edit --prompt`。Part1 为 Agent 内部推理过程，不传给 CLI。

**质量自检**

按 [references/prompts.md § SELF_CHECK](references/prompts.md) 执行 V1-V6 检查，不通过则回到 Prompt 组装步骤修正。

**图片生成**

直接使用 Preflight 解析的 output_dir，确保目录存在后调用 meitu-cli：

```bash
mkdir -p {output_dir}
meitu image-edit \
  --image "<目标参考图URL>" "<商品原图URL>" \
  --prompt "<final_prompt>" \
  --json \
  --download-dir {output_dir}
```

- model 使用默认值 `praline`（适用于多图融合/合成），无需显式传 `--model`
- 多组映射任务 → 依次调用，每组独立生成
- 生成失败时按分级降级（最多重试 2 次）：
  - L1：移除 Prompt 中低优先级修饰词（光影细节、Bokeh 等美化描述）
  - L2：降级枚举参数（`--ratio` 缩小一档，如不传 ratio 使用默认 auto）
  - L3：移除可选参考图，仅保留核心商品原图 + 目标参考图
  - L4：最小化 Prompt 至核心替换指令（商品描述 + 位置 + PREFIX/SUFFIX）
  - L5：停止重试，向用户报错并建议调整输入图片或拆分需求

### Refine

创意型任务必须有独立的迭代精炼循环。

**结果呈现：**
展示生成结果时，说明关键设计决策——为什么选择这个透视角度、集群擦除包含/排除了哪些元素、光影融合的处理方式。让用户理解替换逻辑，以便给出精准反馈。

提示用户："如果需要对图片中的文字内容进行修改，你可以在画布中选中需要修改文字的图片，点击选择'无痕改字'功能进行编辑。"

**反馈分类与响应路由：**

| 反馈类型 | 典型表述 | 调整目标 | 操作 |
|---------|---------|---------|------|
| 色彩/氛围 | "色温再暖一点"、"饱和度太高" | prompt 描述词 | 调整 Part2 body 色彩/氛围描述 → 重新生成 |
| 角度/透视/位置 | "透视不对"、"商品放偏了" | prompt 物理蓝图 | 调整 Part1 空间透视 + Part2 位置描述 → 重新生成 |
| 商品变形/模糊 | "Logo 糊了"、"形状变了" | 参数或输入图 | 检查 --ratio、强化 PREFIX 一致性约束、确认输入图质量 |
| 背景被修改 | "文字颜色变了"、"背景元素消失" | prompt 冻结指令 | 加强 ANTI-MUTATION 段落、检查集群擦除边界 |
| 整体不满意 | "完全不对"、"重来" | 重新分析 | 回到 Execute 图片标记与分析步骤 |

**迭代节奏：**
- 修改意见 → 按上表路由调整 → 回到 Execute Prompt 组装步骤 → 重新生成 → 再次展示
- 认可 → Deliver
- 建议最多 3 轮迭代，超过后主动建议：调整输入图片质量、拆分为更小的替换任务、或调整预期

### Deliver

output_dir 已在 Preflight 解析，此处仅做重命名。
`mv {file} {output_dir}/{date}_{name}.{ext}`

If DESIGN.md Iteration Log > 5 entries → compact: keep recent 5, archive older to `./drafts/design-history.md`

### Record（项目模式 MUST / 一次性模式跳过）

can_record = cwd 有 openclaw.yaml AND $VISUAL 存在（两者缺一即 false）
can_record = false → 跳过。

**例外：** 一次性模式下用户反复表达同一偏好（如多次说"不要渐变"），Agent MAY 直接提议：
"你多次提到不要渐变，要加入全局禁忌列表吗？" → 用户同意 → 写 `$VISUAL/rules/quality.yaml`

**项目模式下：**

- **User approves style →** write observation:

  1. read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back
  2. `len(projects) >= 2` → propose promotion (non-blocking)，在回复末尾提及，不打断主流程
  3. User confirms → 写入目标 + delete observation entry

  Observation entry schema:
  ```yaml
  - key: "偏好观察描述"
    scope-hint: meitu-product-swap    # 来自 project.type；跨场景则为 null
    projects: [project-name]
    first-seen: 2026-03-22
    last-seen: 2026-03-22
  ```

  **晋升路由规则（两种模式通用，「非阻塞」——在回复末尾提及，不打断主流程）：**
  "你在 N 个项目中都偏好 X。要保存吗？
    → 保存到 {scope-hint} 场景 [默认]
    → 保存到全局偏好
    → 不保存"
  **Promotion target 自动路由：**
  - `scope-hint` 非 null → 默认写入 `$VISUAL/memory/scenes/{scope-hint}.md`（不存在则创建，含 frontmatter）
  - `scope-hint` 为 null → 默认写入 `$VISUAL/memory/global.md`
  - 用户可覆盖默认选择
  User confirms → write to target, delete observation entry. User ignores → do nothing.

- **User rejects ("不要 XX")：**
  If rejected element **already in** `$VISUAL/rules/quality.yaml` → 自动过滤，不问。
  If **new** rejection + has openclaw.yaml → ask: "仅这个项目不用 XX，还是以后都不要？"
    仅项目 → append to `./DESIGN.md` Constraints
    以后都不要 → append to `$VISUAL/rules/quality.yaml`（该问答即确认）
  If no openclaw.yaml → current task only, write nothing.

- **Nothing → nothing.**

## Output

- **项目型任务**（有 `openclaw.yaml`）→ `./output/{date}_{effect-name}.{ext}`
- **一次性任务**（`$VISUAL` 存在）→ `$VISUAL/output/meitu-product-swap/{date}_{effect-name}.{ext}`
- 文件名格式：`{date}_{effect-name}.{ext}`（如 `2026-03-22_serum-bottle-marble.jpg`）
- meitu CLI `--download-dir` 下载后需通过 `mv` 重命名为上述格式
