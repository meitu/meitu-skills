---
name: meitu-product-view
description: "从单张商品图生成多角度展示图（三视图、五视图、全角度）。支持白底、场景、透明底等背景模式，适配主流电商平台规格。当用户提到商品三视图、多角度展示、产品展示图、电商多角度、product multi-angle、三视图、转成三视图、生成多角度商品图时触发。"
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

# 商品多角度展示图

从单张商品图生成多角度展示图，支持标准三视图、电商五视图、全角度展示。

## Overview

用户上传一张商品图，自动生成不同角度的展示图。支持白底/场景/透明底背景，可选超分辨率增强，适配淘宝、京东、拼多多、亚马逊等电商平台规格。

## Dependencies

- **meitu-cli** (≥0.1.9): `npm install -g meitu-cli`
  - 凭证配置: `meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 验证: `meitu auth verify --json`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context] → Execute → Refine → Deliver → [Record]
```

> **可选步骤：** [Context] — 一次性模式跳过；[Record] — can_record=false 时跳过。

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
   can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-product-view/`
   `mkdir -p {output_dir}`

> Execute 中所有 `--download-dir {output_dir}` 使用此处解析的路径。

### Context（项目模式执行 / 一次性模式跳过）

mode = one-off → 跳过此步，直接到 Execute。

mode = project → 按序加载（每步 skip if missing）：
1. 读 `./DESIGN.md` → 获取项目决策和 Context References
   - 解析 references（如 `brand: acme`）→ 尝试读 `$VISUAL/assets/brands/acme/`
   - 读到 → 用最新版；读不到 → 回退到 DESIGN.md 中的内联兜底值
2. 读 `$VISUAL/rules/quality.yaml` → 获取 forbidden 列表
3. 读 `$VISUAL/memory/global.md` → 获取跨场景偏好
4. 读 `openclaw.yaml` 的 `project.types`（数组，优先）或 `project.type`（单值 → 视为单元素数组）
   → 对每个 type：查找 `$VISUAL/memory/scenes/{type}.md` → 存在则读取并合并

→ quality forbidden list 过滤生成元素，preferences 增强创意方向
→ `$VISUAL` 不存在 → 跳过 2-4，仅读 DESIGN.md

### Execute

**Step 1: 接收商品图**

用户上传一张商品图。若未上传，提示：

"请上传一张商品图片（正面照效果最佳，背景简洁更利于生成质量）。"

收到图片后，分析以下信息（Agent 自行判断，不调外部工具）：

| 分析项 | 用途 |
|--------|------|
| 商品品类 | 决定推荐角度和场景 |
| 主体形状/比例 | 填充 prompt 的 `{product_description}` |
| 当前拍摄角度 | 决定是否可作为某个视角直接使用 |
| 背景情况 | 决定是否需要 cutout 预处理 |

若用户同时提供了文字描述商品信息 → 优先使用用户描述。

**Step 2: 选择视图方案**

展示选项：

| 方案 | 包含角度 | 适用场景 |
|------|---------|---------|
| **标准三视图** | 正面、右侧、背面 | 基础展示、快速出图 |
| **电商五视图** | 正面、左前45°、右前45°、背面、俯视 | 电商主图套图 |
| **全角度展示** | 正面、左前45°、右前45°、左侧、右侧、背面、俯视、特写 | 高端商品详情页 |
| **拼合三视图** | 一张图内左中右排列正面+侧面+背面 | 社交媒体、快速展示 |
| **自定义** | 用户自选角度组合 | 特殊需求 |

用户选"自定义"时，展示完整角度清单：

| 角度 | 标识 | 方位 |
|------|------|------|
| 正面 | front | 0° |
| 左前45° | front-left-quarter | 315° |
| 右前45° | front-right-quarter | 45° |
| 左侧 | left-side | 270° |
| 右侧 | right-side | 90° |
| 左后45° | back-left-quarter | 225° |
| 右后45° | back-right-quarter | 135° |
| 背面 | back | 180° |
| 俯视 | overhead | 60°仰角 |
| 微俯 | elevated | 30°仰角 |
| 仰视 | low-angle | -30°仰角 |
| 特写 | close-up | 近距离细节 |

If user mentions specific e-commerce platform → read [references/ecommerce-specs.md](references/ecommerce-specs.md) for platform-specific angle recommendations and size requirements → auto-select matching view preset + ratio + size.

**Step 3: 选择背景模式**

| 模式 | 说明 | CLI 处理方式 |
|------|------|-------------|
| **白底** | 纯白背景 | prompt 中加白底描述 |
| **场景** | AI 生成商品使用场景 | prompt 中加场景描述 |
| **保留原背景** | 保持上传图的背景 | 使用中文角度指令 prompt |
| **透明底** | 透明 PNG | 先白底生成，再 cutout |

选择"场景"时 → 根据商品品类推荐 3 个场景描述，询问用户偏好。场景推荐原则：

| 品类 | 推荐场景方向 |
|------|-------------|
| 电子产品 | 极简桌面、科技感空间、办公场景 |
| 服饰/箱包 | 时尚街拍场景、衣帽间、旅行场景 |
| 食品/饮品 | 餐桌场景、厨房、野餐/户外 |
| 家居/家电 | 客厅、卧室、现代家居空间 |
| 美妆/护肤 | 化妆台、浴室、花艺/自然元素 |
| 运动/户外 | 健身房、跑道、户外自然 |

**Step 4: 预处理抠图（条件执行）**

**触发条件**：原图背景杂乱 AND 用户选择了白底或场景模式。

```bash
meitu image-cutout \
  --image {image_url} \
  --model_type 1 \
  --json
```

抠图结果作为后续生成的参考输入。cutout 失败 → 跳过，直接用原图。

**Step 5: 逐角度生成**

这是核心生成步骤。对用户选定的每个角度，调用 `meitu image-edit`。

**工具调用模板：**

```bash
meitu image-edit \
  --image {source_image_url} \
  --prompt "{angle_prompt}" \
  --model praline \
  --ratio {target_ratio} \
  --json \
  --download-dir {output_dir}
```

**Prompt 构建：**

1. 从 [references/prompts.md](references/prompts.md) 选取对应角度的模板（按 `## {angle}-view` section 定位）
2. 填入变量：
   - `{product_description}` ← Step 1 分析结果
   - `{background}` ← Step 3 选择对应的背景后缀（见 prompts.md `## Background Suffixes`）
   - `{scene_description}` ← Step 3 场景描述（仅场景模式）
3. Prompt 使用英文（模型效果更好）
4. 严禁使用 `-ar`、`--no`、`(keyword:1.5)`、`<lora:xxx>` 等平台特定语法

**各角度 → prompts.md section 映射：**

| 角度标识 | Prompt 模板 section |
|---------|-------------------|
| front | `## front-view` |
| right-side | `## right-side-view` |
| left-side | `## left-side-view` |
| back | `## back-view` |
| front-right-quarter | `## front-right-quarter-view` |
| front-left-quarter | `## front-left-quarter-view` |
| back-right-quarter | `## back-right-quarter-view` |
| back-left-quarter | `## back-left-quarter-view` |
| overhead | `## overhead-view` |
| elevated | `## elevated-view` |
| low-angle | `## low-angle-view` |
| close-up | `## close-up-view` |
| 拼合三视图 | `## combo-three-view` |

**特殊情况——保留原背景模式：**

使用中文 prompt（与英文模板不同，这是经验验证过的写法）：

| 角度 | Prompt（原文应用，不修改） |
|------|--------------------------|
| 正面 | 将图中的商品旋转到正面朝向镜头的角度。保持商品直立，不要改变商品外观，保证背景一致性。 |
| 侧面 | 将图中的商品旋转到从右侧面观看的角度，展示商品的侧面轮廓。保持商品直立，不要改变商品外观，保证背景一致性。 |
| 背面 | 将图中的商品旋转到背面朝向镜头的角度，展示商品背部细节。保持商品直立，不要改变商品外观，保证背景一致性。 |
| 45° | 将图中的商品旋转到45度斜角观看的角度。保持商品直立，不要改变商品外观，保证背景一致性。 |
| 俯视 | 从上方俯视角度拍摄图中的商品，展示商品顶部。保持商品直立，不要改变商品外观，保证背景一致性。 |
| 特写 | 将图中的商品放大展示细节部分。保持商品一致性，不要改变商品外观，保证背景一致性。 |

**特殊情况——拼合三视图：**

一次性生成三个视角在同一张图内。从 [references/prompts.md](references/prompts.md) `## combo-three-view` 取模板，填入 `{product_description}` 和 `{background}`：

```bash
meitu image-edit \
  --image {source_image_url} \
  --prompt "{combo_three_view_prompt}" \
  --model praline \
  --ratio 4:3 \
  --json \
  --download-dir {output_dir}
```

**生成顺序策略：**

1. 若原图是正面 → 直接用原图作为正面视图，从其余角度开始生成
2. 若原图不是正面 → 先生成正面，再以正面图为锚点生成其余角度
3. 换背景模式 → 先生成正面场景图，再以正面场景图为参考生成其余角度（保证场景一致性）

换背景模式下，侧面和背面的参考图使用正面场景图（不是原图）：

```bash
# 先生成正面场景图
meitu image-edit \
  --image {original_image_url} \
  --prompt "{front_view_scene_prompt}" \
  --model praline \
  --ratio 1:1 \
  --json \
  --download-dir {output_dir}

# 以正面场景图为参考，生成其余角度
meitu image-edit \
  --image {front_scene_result_url} \
  --prompt "将图中的商品旋转到从右侧面观看的角度，展示商品的侧面轮廓。保持商品直立，不要改变商品外观，保证背景一致性。" \
  --model praline \
  --ratio 1:1 \
  --json \
  --download-dir {output_dir}
```

**`--ratio` 选择：**

| 场景 | ratio |
|------|-------|
| 默认 | 1:1 |
| 指定电商平台 | 按 [references/ecommerce-specs.md](references/ecommerce-specs.md) 要求 |
| 拼合三视图 | 4:3 |
| 用户自定义 | 按用户指定 |

**Step 6: 超分辨率增强（可选）**

**触发条件**：用户主动要求 OR 目标平台要求 ≥2000px（如 Amazon）。

```bash
meitu image-upscale \
  --image {generated_url} \
  --model_type 1 \
  --json \
  --download-dir {output_dir}
```

对每张角度图逐一 upscale。

**Step 7: 透明底处理（条件）**

**触发条件**：Step 3 选择了"透明底"。

对每张生成的角度图执行：

```bash
meitu image-cutout \
  --image {generated_url} \
  --model_type 1 \
  --json \
  --download-dir {output_dir}
```

**错误降级策略：**

| Level | 操作 | 触发条件 |
|-------|------|---------|
| L1 | 移除 prompt 中的修饰词（lighting、material 描述），保留核心角度+商品 | 首次生成失败 |
| L2 | ratio 改为 auto | L1 后仍失败 |
| L3 | 跳过 cutout 预处理，直接用原图生成 | L2 后仍失败 |
| L4 | 简化到最核心描述：仅 "A {angle} view of the product. White background." | L3 后仍失败 |
| L5 | 停止，报错并显示 code 和 hint | 连续 2 次 L4 失败 |

### Refine

展示所有生成的角度图，说明每张的视角。

**反馈分类与响应：**

| 用户反馈 | 调整方式 |
|---------|---------|
| "角度不对" / "再偏一点" | 调整 prompt 中的角度描述词 |
| "商品变形了" / "不像原图" | 在 prompt 末尾追加 "Proportions and every detail exactly matching the uploaded photo" |
| "背景不好看" | 替换场景描述或切换背景模式 |
| "颜色偏了" | 追加 "Color accuracy strictly consistent with the original photo" |
| "要更多角度" | 从角度清单中添加，增量生成（不重新生成已完成的） |
| "换一种风格/氛围" | 调整 lighting/mood 描述词 |
| "分辨率不够" | 追加 upscale 处理 |

**迭代节奏**：建议最多 3 轮。超过 3 轮 → 建议：
1. 更换原始商品图（更好的拍摄角度/光线）
2. 分拆为单角度逐个优化
3. 尝试不同背景模式

### Deliver

output_dir 已在 Preflight 解析完毕，Execute 的 `--download-dir` 已将文件下载到 `{output_dir}`。Deliver 只做重命名：

`mv {output_dir}/{task_id_file} {output_dir}/{date}_{product}_{angle}.{ext}`

`{ext}` 取自 `downloaded_files[0].saved_path` 的实际扩展名。

**命名规则**：`{date}_{product}_{angle}.{ext}`
示例：`2026-03-23_sneaker_front.png`、`2026-03-23_sneaker_back.jpg`、`2026-03-23_sneaker_quarter-right.png`

### Record（项目模式 MUST / 一次性模式跳过）

**前提：** can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）。不满足 → 跳过全部记录，反馈仅当前对话有效。

**No feedback →** 完全跳过，不读 observations.yaml，零开销。

**User approved style →**
  read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back.
  `len(projects) >= 2` → propose promotion (non-blocking).
  提议（在回复末尾提及，不打断主流程）：
  > "顺便说一下，你在 N 个项目中都偏好 X。要保存吗？
  >   → 保存到 product-photography 场景 [默认]
  >   → 保存到全局偏好
  >   → 不保存"
  User confirms → write to `$VISUAL/memory/scenes/{scope}.md` 或 `global.md`，then delete observation entry
  User ignores → do nothing

**User rejected ("不要 XX") →**
  has openclaw.yaml → ask scope: "仅这个项目不用 XX，还是以后都不要？"
    → 仅项目 → append to ./DESIGN.md Constraints
    → 以后都不要 → append to `$VISUAL/rules/quality.yaml`（需用户确认）
  no openclaw.yaml → current task only, write nothing

---

## Output

- 格式：PNG（白底/场景）/ PNG with alpha（透明底）
- 比例：默认 1:1，可按平台需求调整（见 [references/ecommerce-specs.md](references/ecommerce-specs.md)）
- 分辨率：默认 2K，可选 upscale
- 命名：`{date}_{product}_{angle}.{ext}`

## Constraints

- 对话中不展示完整 prompt 内容（除非用户主动要求查看）
- Prompt 模板按原文应用，仅替换 `{variable}` 部分
- 保留原背景模式的中文 prompt 不做任何修改
- 若用户语言为英文，所有交互选项翻译为英文
- 每个角度独立生成调用，保证与原始商品的一致性
- `--download-dir` 始终指向 Preflight 解析的 output_dir，不指向含源文件的目录
