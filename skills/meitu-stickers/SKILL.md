---
name: meitu-stickers
description: "从用户上传的照片生成多风格四宫格表情包贴纸（内置 Q版、3D黏土、像素风、Emoji 风格，也支持自定义风格），拆分为 4 张独立贴纸，可选转成动态 GIF。当用户提到 表情包、贴纸、sticker pack、sticker、emoji pack、生成贴纸、做表情包、Q版贴纸、大头贴 时触发。"
version: "1.1.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY"],"paths":{"read":["~/.meitu/credentials.json","~/.openclaw/workspace/visual/","./openclaw.yaml","./DESIGN.md","~/.openclaw/workspace/visual/rules/quality.yaml","~/.openclaw/workspace/visual/memory/global.md","~/.openclaw/workspace/visual/memory/scenes/","~/.openclaw/workspace/visual/memory/observations/observations.yaml","$VISUAL/rules/quality.yaml","$VISUAL/memory/global.md","$VISUAL/memory/scenes/","$VISUAL/memory/observations/observations.yaml"],"write":["~/.openclaw/workspace/visual/","./DESIGN.md","./output/","~/.openclaw/workspace/visual/rules/quality.yaml","~/.openclaw/workspace/visual/memory/global.md","~/.openclaw/workspace/visual/memory/scenes/","~/.openclaw/workspace/visual/memory/observations/observations.yaml","$VISUAL/rules/quality.yaml","$VISUAL/memory/global.md","$VISUAL/memory/scenes/","$VISUAL/memory/observations/observations.yaml"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"dataFlow":"Inputs, selected local context, and generated prompts may be sent to Meitu OpenAPI when used by the workflow.","credentials":"Credentials are used only for CLI authentication and must not be disclosed.","persistence":"Record workflows may access declared project and visual memory/rules files."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "Uploaded photos, style selections, generated prompts, and optional project context may be sent to Meitu OpenAPI."
  persistence: "Project mode may write output files and may update project or visual-memory files according to the Record workflow."
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
        - ./openclaw.yaml
        - ./DESIGN.md
        - ~/.openclaw/workspace/visual/rules/quality.yaml
        - ~/.openclaw/workspace/visual/memory/global.md
        - ~/.openclaw/workspace/visual/memory/scenes/
        - ~/.openclaw/workspace/visual/memory/observations/observations.yaml
        - $VISUAL/rules/quality.yaml
        - $VISUAL/memory/global.md
        - $VISUAL/memory/scenes/
        - $VISUAL/memory/observations/observations.yaml
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
        - ./DESIGN.md
        - ./output/
        - ~/.openclaw/workspace/visual/rules/quality.yaml
        - ~/.openclaw/workspace/visual/memory/global.md
        - ~/.openclaw/workspace/visual/memory/scenes/
        - ~/.openclaw/workspace/visual/memory/observations/observations.yaml
        - $VISUAL/rules/quality.yaml
        - $VISUAL/memory/global.md
        - $VISUAL/memory/scenes/
        - $VISUAL/memory/observations/observations.yaml
    - type: exec
      commands:
        - meitu
---

# Meitu Stickers

## Overview
从用户上传的照片生成多风格四宫格表情包贴纸（2x2 grid），拆分为 4 张独立贴纸，可选将指定贴纸或全部转成动态 GIF 表情包。支持 Q版、3D黏土、像素风、Emoji 四种内置风格，以及用户自定义风格。

## Dependencies
- tools: meitu-cli — 美图 AI 开放平台 CLI（图片生成/编辑、视频生成、格式转换）
  - Install: `npm install -g meitu-cli@latest`（包名 meitu-cli）
- credentials: 美图 AI 开放平台 API 凭证
  - 环境变量：`MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`
  - 或配置文件：`~/.meitu/credentials.json`
  - 首选环境变量：`MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`
  - 或预置凭证文件：`~/.meitu/credentials.json`
  - 如需人工初始化本地凭证，可显式执行 `meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`（会写入本地文件）
  - 验证：`meitu auth verify --json`
- workspace (optional): `{OPENCLAW_HOME}/workspace/visual/`
  - Not found → skip all knowledge reads, skill works without it

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context] → Execute → Refine → Deliver → [Record]
              ↑ 创意型任务执行                   ↑ 项目模式时执行
              ↑ 工具型任务跳过                   ↑ 一次性模式跳过
```

### Preflight
1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli@latest`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
   can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-stickers/`
   `mkdir -p {output_dir}`

### Context（创意型任务 + 项目模式时执行）

mode = one-off → 跳过此步，直接到 Execute。

用户点名引用品牌资产 AND `$VISUAL` exists → 仅按需读 `$VISUAL/assets/`

mode = project → 逐步执行：
  1. 读 `./DESIGN.md`
  2. 提取 Context References → 尝试读 `$VISUAL/assets/` 或 `$VISUAL/rules/` 全局资产 → 读不到用 DESIGN.md 内联兜底值
  3. 读 quality.yaml → global.md → scenes/{type}.md（type 从 openclaw.yaml 的 `project.types`（数组优先）或 `project.type` 读取，均 skip if missing）
  → quality forbidden list 过滤生成元素，preferences 增强创意方向；design 为 null → Execute 后创建

### Execute

**Classify Input**

| 场景 | 条件 | 动作 |
|------|------|------|
| A — 单张清晰主体照片 | 用户上传 1 张含可识别主体（人/动物/角色/建筑/产品/食物） | → Select Style |
| B — 多张照片 | 用户上传 > 1 张图片 | → Composite → Select Style |
| C — 已是表情包风格 | 用户图片已为某种表情包风格 | → Select Style，作为精修/编辑请求 |
| D — 未上传图片 | 无图片 | 回复提示（见下方），等待上传 |

**场景 D 回复：** "请上传一张照片，我来帮你生成表情包贴纸~"
若含"一组"/"一套"等多图关键词 → 额外提示"如果需要多人合照效果，请一次选择多张图片上传哦"

**Composite Multiple Photos (Scenario B only)**

```bash
meitu text-to-image \
  --skill_name skill_meitu-stickers \
  --image_list "<image_url_1>" "<image_url_2>" \
  --prompt "将多张图片主体物合成一张合照（如第一张照片的人物与第二张照片人物合照），{user_pose_requirement}，保持主体物样貌相似度不变，保持图片风格不变" \
  --json
```

- `{user_pose_requirement}`: 用户指定了姿势/互动则加入，否则省略此 clause。
- 合成结果作为 Generate Sticker Grid 的源图。

**Select Style**

**风格识别决策表：**

| 用户关键词 | 风格 ID | 说明 |
|-----------|---------|------|
| Q版、chibi、大头贴、可爱Q版 | `chibi` | 大头小身、圆润五官、夸张表情 |
| 3D、黏土、clay、泥塑、粘土 | `clay` | 3D黏土/橡皮泥质感、柔软圆润、哑光纹理 |
| 像素、pixel、8bit、复古游戏 | `pixel` | 像素画风格、清晰像素边缘、有限调色板 |
| emoji、表情符号、圆脸 | `emoji` | 粗描边、扁平色彩、简化五官、圆形面部 |
| 其他指定风格（如"水彩"、"赛博朋克"） | `custom` | 按用户描述构建 prompt |
| 未指定风格 | — | 主动询问（见下方） |

**未指定风格时的询问：**
"你想要哪种风格的表情包？我支持这些内置风格：
🎨 Q版 — 大头萌系
🧸 3D黏土 — 立体泥塑感
👾 像素风 — 复古游戏画风
😊 Emoji — 圆脸扁平风

也可以告诉我你想要的任何风格，比如「水彩风」「赛博朋克」~"

**Generate Sticker Grid**

**Prompt 模板：** 见 [references/prompts.md](references/prompts.md)。
- 选择对应风格 section（`## chibi` / `## clay` / `## pixel` / `## emoji` / `## custom`）
- 拼接 `## GRID_CONSTRAINTS` 确保生成结果可被 `image-grid-split` 正确切分

**风格 → 命令决策表：**

| 风格 ID | 命令 | 原因 |
|---------|------|------|
| `chibi` | `text-to-image --image_list` | 参考真人图做艺术风格化（大头 Q 版） |
| `clay` | `text-to-image --image_list` | 参考真人图生成 3D 黏土风 |
| `pixel` | `text-to-image --image_list` | 参考真人图生成像素风 |
| `emoji` | `text-to-image --image_list` | 参考真人图生成扁平表情风 |
| `custom`（画风类：水彩/赛博朋克/油画等） | `text-to-image --image_list` | 2.0.6 下风格化优先走参考图文生图 |
| `custom`（写实类：写真/证件照等） | `text-to-image --image_list` | 保留人物特征，但避免依赖旧的 `image-edit` 风格模型 |
| `custom`（不确定） | `text-to-image --image_list` | 统一走参考图生成，减少路由分歧 |

> **说明：** 当前 CLI 已支持 `image-edit --model nougat` 作为显式高质量编辑路径；但贴纸场景仍统一优先走 `text-to-image --image_list`，因为四宫格贴纸更适合参考图文生图链路，风格和构图控制更稳定。

**生成命令：**

```bash
meitu text-to-image \
  --skill_name skill_meitu-stickers \
  --image_list "<source_image_url>" \
  --ratio 1:1 \
  --size 2K \
  --prompt "{STYLE_PROMPT} {GRID_CONSTRAINTS}" \
  --json --download-dir {output_dir}
```
`{STYLE_PROMPT}` 负责指定风格类型（chibi / clay / pixel / emoji / custom）。

**错误降级策略（L1-L5）：**

| Level | 操作 | 具体内容 |
|-------|------|----------|
| L1 | 移除低优先级修饰词 | 移除风格 prompt 中的描述性修饰（如 "matte clay texture with subtle highlights"），保留核心风格词 + GRID_CONSTRAINTS |
| L2 | 简化风格描述 | 将风格 prompt 缩减为一句：如 `chibi` → "2x2 grid of chibi stickers from this photo, 4 expressions" + GRID_CONSTRAINTS |
| L3 | 移除可选输入 | N/A（源图为必须输入） |
| L4 | 最小化到核心要素 | prompt → "2x2 sticker grid, 4 stickers, {style} style, white background, well separated" |
| L5 | 停止报错 | 连续 2 次失败 → 报错给用户，附 code 和 hint |

**展示四宫格给用户，等待确认后再切图。** 不要直接执行 grid-split。
→ 进入 Refine

### Refine

**Phase 1: 确认四宫格**

展示生成的 2x2 grid，说明使用的风格，问：
"这是生成的{style_name}风格四宫格表情包，你看看整体效果满意吗？满意的话我帮你切成 4 张独立贴纸~"

等待用户回复：

**反馈分类与处理：**
| 反馈类型 | 示例 | 处理方式 |
|----------|------|----------|
| 换风格 | "换成像素风"、"试试 3D 的" | 回到 Select Style → Generate Sticker Grid |
| 调表情 | "第二个表情太夸张了"、"要更可爱" | 调整 prompt 中表情描述 → Generate Sticker Grid |
| 调风格细节 | "颜色再鲜艳一点"、"线条粗一些" | 追加 prompt 修饰 → Generate Sticker Grid |
| 切图问题 | "贴纸之间太近了"、"有重叠" | 强化 GRID_CONSTRAINTS 间距 → Generate Sticker Grid |
| 满意 | "好"、"可以"、"满意" | → 进入 Phase 2 |

建议最多 3 轮迭代，超过后主动建议调整方向或分拆需求。

**Phase 2: 切图 + 确认贴纸**

用户确认四宫格后，执行切图：

```bash
meitu image-grid-split --image_url "<grid_image_url>" --download-dir {output_dir}/split   --skill_name skill_meitu-stickers
```

If `image-grid-split` returns fewer than 4 images（grid spacing insufficient for detection）:
1. Re-generate 2x2 grid with stronger spacing prompt — append: "Ensure each sticker is clearly separated with at least 25% white space between them. Each sticker must be a completely independent illustration with no visual connection to adjacent stickers."
2. Retry `image-grid-split`. If still < 4 → deliver grid image as-is and inform user.

**一次性展示全部 4 张独立贴纸**（下载所有图片后在同一条回复中全部展示，不要分批），问：
"切好啦~ 要不要把其中某张或者全部转成动态表情包（GIF）？告诉我编号（如 1、3）或者说「全部」就行，不需要的话直接说满意我就帮你保存~"

等待用户回复：
- **不要 GIF** → 进入 Deliver
- **指定 GIF 转换**（某张 / 多张 / 全部）→ 执行 GIF 转换（below）→ 展示结果 → 进入 Deliver

**GIF 转换流程（逐张顺序执行）：**

a. Image to Video:
```bash
meitu image-to-video \
  --skill_name skill_meitu-stickers \
  --image_list "<selected_sticker_url>" \
  --prompt "{style_name} character performing a simple animated expression, loopable motion" \
  --json \
  --download-dir {output_dir}/video
```
Wait for async result（CLI 自动轮询，视频下载到 `{output_dir}/video`）。

b. **展示视频给用户**（已下载到 `{output_dir}/video`），让用户预览动态效果。

c. Video to GIF（使用 image-to-video 下载到本地的视频文件）:
```bash
meitu video-to-gif --video_url "{output_dir}/video/<video_task_id_file>" --prompt "transparent animated sticker" --json --download-dir {output_dir}/gif   --skill_name skill_meitu-stickers
```

If user selects "全部", process all stickers sequentially (one at a time: image→video→展示视频→gif, then next).
If user selects multiple (e.g., "1 和 3"), process the specified ones sequentially.

### Deliver
文件已在 `output_dir`（生成时使用 `--download-dir`），只需 rename：

`mv {output_dir}/split/{task_id_file} {output_dir}/{YYYY-MM-DD}_{style}-sticker-{n}.{ext}`
动态 GIF → `mv {output_dir}/gif/{task_id_file} {output_dir}/{YYYY-MM-DD}_{style}-sticker-{n}-animated.{ext}`

### Record（项目模式时执行）

can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）→ false 时跳过。一次性模式下反馈仅当前对话有效。
例外：一次性模式下用户反复表达同一偏好 → Agent MAY 提议写入 `$VISUAL/rules/quality.yaml`

User approved style →
  read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back.
  `len(projects) >= 2` → propose promotion (non-blocking).
  非阻塞提议晋升（在回复末尾提及，不打断主流程）→ confirmed → write target + delete observation entry

User rejected ("不要 XX") →
  has openclaw.yaml → ask scope → project: ./DESIGN.md Constraints / universal: quality.yaml
  no openclaw.yaml → current task only

No feedback → skip entirely.

## Output
- 4 张独立表情包贴纸（from grid split），风格与用户选择一致
- 可选：动态 GIF 表情包（for selected sticker(s)）
- 文件命名：`{YYYY-MM-DD}_{style}-sticker-{n}.{ext}`（e.g., `2026-03-22_chibi-sticker-1.jpg`、`2026-03-22_pixel-sticker-3-animated.gif`）

