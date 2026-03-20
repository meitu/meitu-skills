# CLI 工具集描述体系

## 这是什么

这是一套面向 Agent / OpenClaw / Skill 调用的 **CLI 图片与视频处理工具集的描述管理体系**。它解决的核心问题是：如何让 AI Agent 在 13 个功能相近的工具中准确选择正确的工具，并传入正确的参数。

## 架构原则：Single Source of Truth

```
tools.yaml  ← 唯一需要人工维护的文件
    │
    │  node scripts/generate.js  (或 npm run generate)
    ▼
  CLI 管线（全部 13 个工具均已配置 cli 字段）：
    ├── meitu-tools/scripts/lib/commands-data.json  ← CLI 注册表数据
    ├── meitu-tools/generated/manifest.json         ← 能力清单
    ├── meitu-tools/SKILL.md (能力目录段)
    └── SKILL.md (工具映射段)

  Agent 描述管线（全部 13 个工具）：
    ├── tools-ssot/agent-descriptions.yaml
    ├── tools-ssot/tools-overview.csv
    └── tools-ssot/disambiguation-matrix.md
```

**增删改任何工具，只修改 `tools.yaml`，然后跑一次 `npm run generate`，所有派生产物自动更新。禁止手动编辑生成产物。**


## 文件说明

### `tools.yaml` — 唯一源文件

每个工具包含以下字段：

| 字段 | 必选 | 作用 |
|---|---|---|
| `id` | ✅ | 工具标识（如 `image-edit`） |
| `name` | ✅ | 中文功能名 |
| `summary` | ✅ | ≤40字的一句话描述，Agent 粗筛用 |
| `triggers` | ✅ | 触发条件列表：什么用户意图应该选这个工具 |
| `prefer_over` | 可选 | 与哪些工具容易混淆，选当前工具的判断条件 |
| `input` | ✅ | 输入规格（类型、数量、说明） |
| `output` | ✅ | 输出规格 |
| `params` | 可选 | 额外参数，如子模型选择（含选择规则） |
| `constraints` | 可选 | 硬性约束、前置依赖 |
| `not_for` | ✅ | 不适用场景 + 应转向的工具 |
| `cli` | 可选 | CLI 注册表数据（有此字段的工具才进入 CLI 管线） |

#### `cli` 字段详细

| 子字段 | 说明 |
|---|---|
| `command` | 实际 CLI 命令名（省略则用 `id`） |
| `requiredKeys` | 必填输入键 |
| `optionalKeys` | 可选输入键 |
| `arrayKeys` | 值为数组的键 |
| `commandAliases` | 命令别名列表 |
| `inputAliases` | 输入键别名映射 |

### 生成产物说明

#### `commands-data.json` — CLI 注册表数据

由 `meitu-tools/scripts/lib/commands.js` 读取，驱动 CLI 的命令解析、别名路由、输入校验。

#### `agent-descriptions.yaml` — Agent 可消费的工具描述

每个工具编译为一个 `description` 字符串，内部使用 XML 标签分段：

```xml
<summary>一句话描述</summary>
<input>输入规格</input>
<o>输出规格</o>
<triggers>触发条件（仅高混淆工具保留）</triggers>
<param name="model" values="nougat/gummy/praline" default="praline">
  选择规则...
</param>
<constraints>硬性约束</constraints>
<prefer_over tool="xxx">优先条件</prefer_over>
<not_for>不适用场景及转向</not_for>
```

**使用方式：** 在 CLI 框架注册工具时，将每个工具的 `description` 值直接作为工具描述字段。Agent（LLM）在做 tool selection 时会解析这些 XML 标签进行路由决策。

#### `tools-overview.csv` — 表格总览

三列：`功能名称, 命令名, 描述`。描述是将所有结构化字段压缩为一段纯文本。适用于在表格工具中浏览，或作为不支持结构化描述的框架的 fallback。

#### `disambiguation-matrix.md` — 消歧矩阵

**自动从 `tools.yaml` 的 `prefer_over` 和 `not_for` 字段提取**，包含三部分：

1. **工具优先级关系表** — "工具A 优先于 工具B，当……"
2. **不适用场景转向表** — "工具A 不适用于……，应转向工具B"
3. **常见调用链** — 如 `image-cutout → image-edit`

可选择将此矩阵嵌入 Agent 的 system prompt 作为辅助决策材料。在工具数量 ≤15 时通常不需要，`agent-descriptions.yaml` 自身的 `prefer_over` / `not_for` 已足够覆盖消歧。


## 当前工具清单（13个）

| 类别 | 工具 | 概述 | CLI 支持 |
|---|---|---|---|
| 视频 | `video-motion-transfer` | 动作迁移 | ✅ |
| 视频 | `image-to-video` | 图生视频（音画同步/对口型） | ✅ |
| 视频 | `text-to-video` | 文生视频（电影氛围/运镜） | ✅ |
| 视频 | `video-to-gif` | 视频转GIF | ✅ |
| 图片生成 | `image-generate` | 文/图生图（主体一致性+风格迁移） | ✅ |
| 图片生成 | `image-poster-generate` | 海报生成（中文/非中文排版） | ✅ |
| 图片编辑 | `image-edit` | 通用编辑（含3个子模型，见下文） | ✅ |
| 图片编辑 | `image-upscale` | 超清/降噪 | ✅ |
| 图片编辑 | `image-beauty-enhance` | 单人美颜 | ✅ |
| 图片编辑 | `image-face-swap` | 换脸 | ✅ |
| 图片编辑 | `image-try-on` | 虚拟试衣 | ✅ (as `image-virtual-tryon`) |
| 图片工具 | `image-cutout` | 抠图 | ✅ |
| 图片工具 | `image-grid-split` | 宫格拆分（当前四宫格） | ✅ |


## image-edit 子模型路由

`image-edit` 是唯一需要 Agent 选择子模型的工具，通过 `model` 参数指定：

| 优先级 | model 值 | 一句话判断 | 典型场景 | 输出特征 |
|---|---|---|---|---|
| 1 | `nougat` | 变画风 | 卡通化、3D手办、二次元、简笔画 | 不像真人 |
| 2 | `gummy` | 拍写真/换发型 | 人像/宠物写真、发型调整 | 像真人 |
| 3 | `praline`（默认） | 改内容 | 文字操作、换背景、多图融合、分析标注 | 编辑后的图 |

**判断顺序：先看是否命中 nougat（艺术风格化），再看是否命中 gummy（写真/发型），都不命中则走 praline 兜底。**


## 维护指南

### 新增工具

1. 在 `tools.yaml` 的对应类别下添加完整的工具定义
2. 如果新工具已有 CLI 命令支持，添加 `cli` 字段
3. 如果新工具与现有工具容易混淆，在双方都加上 `prefer_over` 条目
4. 在可能被误选的现有工具的 `not_for` 中补充转向条目
5. 运行 `npm run generate` 重新生成

### 修改现有工具

1. 在 `tools.yaml` 中直接修改对应字段
2. 如果修改了 `prefer_over` 或 `not_for`，检查关联工具是否也需要同步调整
3. 运行 `npm run generate` 重新生成

### 新增子模型（给已有工具加 model 参数）

1. 在工具的 `params` 字段下添加 `model` 定义
2. 写明 `values`（可选值）、`default`（默认值）和 `selection_rule`（选择规则）
3. `selection_rule` 要写清楚优先级顺序和冲突处理规则
4. 运行 `npm run generate` 重新生成

### 验证检查清单

- [ ] `tools.yaml` 语法正确（`node -e "require('js-yaml').load(require('fs').readFileSync('tools-ssot/tools.yaml','utf8'))"` 无报错）
- [ ] `npm run generate` 运行成功，输出 `done.`
- [ ] 新工具在 `agent-descriptions.yaml` 中有对应条目
- [ ] 新工具在 `disambiguation-matrix.md` 的关系表中出现
- [ ] 所有相关工具的 `prefer_over` 是双向的（A 优先于 B 时，B 也应有对 A 的条目）
- [ ] 如有 `cli` 字段，`commands-data.json` 中有对应条目


## 设计决策记录

### 为什么用 XML 标签而非 Markdown 或 JSON 做 Agent description？

LLM 对 XML 标签有天然的结构感知能力，能精准定位到 `<not_for>` 做消歧判断，不会被 `<summary>` 的描述性文字干扰。Markdown 的 `##` 和 `-` 在 tool description 上下文中没有特殊语义权重；JSON 的引号和逗号浪费 token。

### 为什么 image-edit 用方案 B（Agent 选模型）而非方案 C（CLI 内部路由）？

方案 B 让 Agent 显式传入 `model` 参数。虽然增加了 Agent 的决策负担，但好处是：调用链可追溯（能看到 Agent 选了哪个模型），便于 debug 和优化路由规则。

### 为什么消歧矩阵是自动生成而非手动维护？

消歧关系已经在每个工具的 `prefer_over` 和 `not_for` 中声明了，矩阵只是换一个"从场景出发"的视角聚合同一份数据。手动维护两处会导致不一致，违反 SSOT。

### 为什么 CLI 注册表数据用 JSON 而非直接读 YAML？

`commands.js` 运行在 `meitu-tools/scripts/` 目录下，不应依赖 `js-yaml`（避免给运行时引入额外依赖）。生成阶段将 YAML 编译为 JSON，运行时直接 `require()` 即可，零依赖。
