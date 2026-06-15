---
name: meitu-game-2d-assets
description: "为 2D 游戏制作单体素材、角色立绘、图标、道具、简易 sprite sheet 与 tileset 草图。支持像素风、矢量扁平、手绘卡通等风格，可组合文生图、图生图、抠图、宫格拆分与超分优化。当用户提到游戏素材、2d asset、sprite、spritesheet、tileset、角色素材、道具图标、像素素材、游戏立绘时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY"],"paths":{"read":["~/.meitu/credentials.json","~/.openclaw/workspace/visual/","./openclaw.yaml","./DESIGN.md","~/.openclaw/workspace/visual/rules/quality.yaml","~/.openclaw/workspace/visual/memory/global.md","~/.openclaw/workspace/visual/memory/scenes/","~/.openclaw/workspace/visual/memory/observations/observations.yaml","$VISUAL/rules/quality.yaml","$VISUAL/memory/global.md","$VISUAL/memory/scenes/","$VISUAL/memory/observations/observations.yaml"],"write":["~/.openclaw/workspace/visual/","./DESIGN.md","~/.openclaw/workspace/visual/rules/quality.yaml","~/.openclaw/workspace/visual/memory/global.md","~/.openclaw/workspace/visual/memory/scenes/","~/.openclaw/workspace/visual/memory/observations/observations.yaml","$VISUAL/rules/quality.yaml","$VISUAL/memory/global.md","$VISUAL/memory/scenes/","$VISUAL/memory/observations/observations.yaml","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"dataFlow":"Inputs, selected local context, and generated prompts may be sent to Meitu OpenAPI when used by the workflow.","credentials":"Credentials are used only for CLI authentication and must not be disclosed.","persistence":"Record workflows may access declared project and visual memory/rules files."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "Inputs, selected local context, and generated prompts may be sent to Meitu OpenAPI when used by the workflow."
  persistence: "Record workflows may read/write declared project files and visual memory/rules files, including observations, scene/global memory, and quality rules."
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
        - ~/.openclaw/workspace/visual/rules/quality.yaml
        - ~/.openclaw/workspace/visual/memory/global.md
        - ~/.openclaw/workspace/visual/memory/scenes/
        - ~/.openclaw/workspace/visual/memory/observations/observations.yaml
        - $VISUAL/rules/quality.yaml
        - $VISUAL/memory/global.md
        - $VISUAL/memory/scenes/
        - $VISUAL/memory/observations/observations.yaml
        - ./output/
    - type: exec
      commands:
        - meitu
---

# meitu-game-2d-assets

## Overview

面向 2D 游戏生产可直接进入后续美术流程的素材草图与半成品，重点覆盖：

1. 单体素材：图标、道具、武器、金币、宝箱、药水、UI 小物件
2. 角色素材：角色立绘、敌人概念图、NPC 半身或全身设定
3. 网格素材：四宫格/九宫格 sprite sheet、简易动作帧、tileset 草图
4. 资产整理：透明底导出、宫格拆分、清晰度增强、局部重绘

本 Skill 的目标不是做完整游戏场景原画、3D 建模或复杂骨骼动画，而是为游戏策划、美术和独立开发者快速产出可迭代的 2D 资产基础稿。

## Dependencies

- tools: meitu-cli
  - `text-to-image` - 从文字生成单体素材、角色概念、sprite sheet 或 tileset 草图
  - `image-edit` - 基于参考图做局部修改、延续风格批量变体、修正细节
  - `image-cutout` - 将生成结果抠成透明底素材
  - `image-grid-split` - 将 sprite sheet / 宫格图拆成独立帧
  - `image-superres-enhance` - 对低分辨率素材做超分和锐化增强
- credentials: 美图 AI 开放平台 API 凭证
  - 环境变量：`MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`
  - 或配置文件：`~/.meitu/credentials.json`
  - 验证：`meitu auth verify --json`
- workspace (optional): `{OPENCLAW_HOME}/workspace/visual/`
  - Not found -> skip all knowledge reads, skill works without it

> 路径别名：下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight -> [Context] -> Execute -> Refine -> Deliver -> [Record]
             ^ 创意型任务执行                  ^ 项目模式时执行
             ^ 一次性模式跳过 Context         ^ 一次性模式跳过
```

### Preflight

1. `meitu --version` -> 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` -> 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` -> project mode; else -> one-off
   can_record = cwd 有 `openclaw.yaml` AND `$VISUAL` 存在（两者缺一即 false）
4. Resolve output_dir: `openclaw.yaml` -> `./output/` | else -> `$VISUAL/output/meitu-game-2d-assets/`
   `mkdir -p {output_dir}`
5. 解析用户需求中的最少资产规格：
   - asset_type：`icon | prop | character | enemy | tileset | sprite-sheet`
   - style：`pixel | flat-vector | hand-painted | chibi-cartoon | retro-rpg | custom`
   - ratio：未指定时按素材类型自动补默认值

### Context（项目模式执行 / 一次性模式跳过）

mode = one-off -> 跳过此步，直接到 Execute。以下仅限 project 模式：

1. 读 `./DESIGN.md`，提取世界观、题材、平台、角色设定、UI 风格、目标分辨率
2. 若 `DESIGN.md` 提到品牌或项目资产，按需读取 `$VISUAL/assets/`
3. 读 `$VISUAL/rules/quality.yaml` -> forbidden list
4. 读 `$VISUAL/memory/global.md` -> 全局美术偏好
5. 从 `openclaw.yaml` 读 `project.types`（数组优先）或 `project.type`
   -> 对每个 type 读 `$VISUAL/memory/scenes/{type}.md`

上下文作用：
- 统一素材风格、色板、轮廓粗细、世界观元素
- 避免生成与现有项目美术方向冲突的资产

### Execute

**先做任务分类**

| 场景 | 条件 | 主工具路径 |
|------|------|-----------|
| A - 从零生成单体素材 | 无参考图，生成图标/道具/角色 | `text-to-image` |
| B - 基于参考图改造素材 | 用户提供参考图或旧资产 | `image-edit` |
| C - 生成 sprite sheet / 帧序列草图 | 明确提到 2x2/3x3/四宫格/动作帧 | `text-to-image` -> `image-grid-split` |
| D - 导出透明底 | 需要可直接贴入引擎/PS 的透明素材 | `image-cutout` |
| E - 提高清晰度 | 结果太糊、要放大、要高清 | `image-superres-enhance` |

**风格识别决策表**

| 用户关键词 | style_id | 说明 |
|-----------|----------|------|
| 像素、pixel、8bit、16bit、复古像素 | `pixel` | 清晰像素边缘，有限调色板，避免抗锯齿 |
| 扁平、vector、手游 UI、卡通图标 | `flat-vector` | 平面矢量、清晰描边、便于二次排版 |
| 手绘、厚涂、日系、原画感 | `hand-painted` | 手绘贴图感，更适合角色与敌人设定 |
| Q版、萌系、chibi | `chibi-cartoon` | 大头小身，适合休闲游戏角色 |
| 横版闯关、RPG、复古冒险 | `retro-rpg` | 适合武器、怪物、地块与 UI 小物件 |
| 其他指定风格 | `custom` | 按用户描述拼装 prompt |

**默认比例映射**

| asset_type | 默认 ratio | 说明 |
|-----------|-----------|------|
| `icon` / `prop` / `tileset` | `1:1` | 便于切图与导入 |
| `character` / `enemy` | `3:4` | 适合立绘与站姿稿 |
| `sprite-sheet` | `1:1` | 统一宫格画布，后续靠宫格拆分 |

**Prompt 组装规则**

从 [references/prompts.md](references/prompts.md) 选取：

1. `## Style Prompts` 中对应 style section
2. `## Asset Templates` 中对应 asset_type section
3. 若是 sprite sheet，追加 `## Grid Constraints`
4. 若用户要求透明底或方便抠图，追加纯底或留白约束

---

**Scenario A - 从零生成单体素材**

适用：图标、武器、宝箱、药水、单角色、敌人草图

命令：

```bash
meitu text-to-image \
  --skill_name skill_meitu-game-2d-assets  \
  --prompt "{ASSET_PROMPT}" \
  --size 2K \
  --ratio {ratio} \
  --json --download-dir {output_dir}
```

推荐 prompt 结构：

`{style_prompt} {asset_template} game asset, centered composition, clean silhouette, readable at small size, consistent material rendering`

---

**Scenario B - 基于参考图改造素材**

适用：
- 用户已有旧素材，想换颜色/材质/武器/服装
- 想保留造型语言，扩一套变体
- 想统一多个素材风格

命令：

```bash
meitu image-edit \
  --skill_name skill_meitu-game-2d-assets  \
  --image_list "{ref_image_url}" \
  --prompt "{EDIT_PROMPT}" \
  --ratio {ratio} \
  --json --download-dir {output_dir}
```

Prompt 约束：
- 保持主体可识别轮廓
- 明确写出要保留什么、替换什么
- 若做游戏图标，必须强调 `clean silhouette` 和 `small-size readability`

---

**Scenario C - 生成 sprite sheet / 帧序列草图**

适用：
- 角色待机 4 帧
- 宝箱开启 4 帧
- 火焰/爆炸 4 或 9 帧
- 简易地块 tileset 草图

第一步先生成宫格图：

```bash
meitu text-to-image \
  --skill_name skill_meitu-game-2d-assets  \
  --prompt "{SPRITESHEET_PROMPT}" \
  --size 2K \
  --ratio 1:1 \
  --json --download-dir {output_dir}
```

第二步仅在用户确认宫格合理后再拆帧：

```bash
meitu image-grid-split \
  --skill_name skill_meitu-game-2d-assets  \
  --image_url "{grid_image_url}" \
  --json --download-dir {output_dir}/split
```

`SPRITESHEET_PROMPT` 必须包含：
- 总帧数说明（如 `2x2 sprite sheet`, `4 frames`, `3x3 tileset`）
- 帧间留白
- 每格主体独立完整
- 固定镜头和统一角色比例

如果 `image-grid-split` 返回帧数不足：
1. 强化 prompt 中的间距要求
2. 重新生成宫格
3. 仍不足则保留宫格图并告知用户需手工辅助切分

---

**Scenario D - 导出透明底素材**

适用：
- 用户要 PNG 透明底
- 生成图需要进 Unity、Godot、Cocos、PS

命令：

```bash
meitu image-cutout \
  --skill_name skill_meitu-game-2d-assets  \
  --image_url "{asset_image_url}" \
  --prompt "{SUBJECT_DESC}" \
  --json --download-dir {output_dir}
```

优先策略：
- 规则明确的单主体素材优先走透明底导出
- 若素材背景复杂且抠图失败，先用 `image-edit` 重做纯底版本，再 `image-cutout`

---

**Scenario E - 清晰度增强**

适用：
- 用户说结果糊
- 要导出到更高分辨率
- 像素风草图需要更清晰的边缘展示

命令：

```bash
meitu image-superres-enhance \
  --skill_name skill_meitu-game-2d-assets  \
  --image_url "{asset_image_url}" \
  --prompt "{CONTENT_DESC}" \
  --json --download-dir {output_dir}
```

说明：
- 像素风超分前先提醒用户：若目标是保留像素颗粒感，优先保持整数倍放大思路，避免过度平滑

### Refine

创意型场景必须走独立精炼循环，建议最多 3 轮：

1. 展示当前结果，并说明其 asset_type、style、是否适合继续拆分/抠图
2. 将反馈分为以下几类：

| 反馈类型 | 示例 | 处理方式 |
|---------|------|---------|
| 换风格 | “改成像素风” “更像日系 RPG” | 切换 style prompt，重新生成 |
| 改主体 | “剑太短了” “角色改成法师” | 修改 asset template 或 edit prompt |
| 改可读性 | “缩小后看不清” | 强化 silhouette / contrast / simple shape |
| 改帧动画 | “四帧差异不够大” | 强化每帧动作描述，重新生成 sprite sheet |
| 导出需求 | “给我透明底” “拆成单张” | 进入 cutout / grid-split 路径 |
| 满意 | “可以” “就这样” | 进入 Deliver |

3. 对 sprite sheet，必须先确认宫格构图和帧间距，再执行拆分
4. 对角色或道具资产，若用户想保留同一世界观，后续变体优先走 `image-edit`

### Deliver

文件已在 `output_dir`，只需按素材类型重命名：

- 单体素材：`{YYYY-MM-DD}_{style}_{asset-type}_{slug}.{ext}`
- 拆分帧：`{YYYY-MM-DD}_{style}_{asset-type}_frame-{n}.{ext}`
- 透明底：`{YYYY-MM-DD}_{style}_{asset-type}_cutout.png`
- 超分版：`{YYYY-MM-DD}_{style}_{asset-type}_hd.{ext}`

示例：
- `2026-05-19_pixel_prop_health-potion.png`
- `2026-05-19_flat-vector_icon_treasure-chest_cutout.png`
- `2026-05-19_chibi-cartoon_character_knight_frame-3.png`

### Record（项目模式时执行）

can_record = cwd 有 `openclaw.yaml` AND `$VISUAL` 存在（两者缺一即 false）-> false 时跳过。

可记录内容：
- 用户长期偏好的 style（如偏像素、偏粗描边、偏低饱和）
- 项目统一约束（如地块必须俯视角、角色必须 3/4 视角）
- 资产命名约定与常用 ratio

仅当用户明确认可某风格方向时才写入 memory，避免把临时尝试误记为长期偏好。

## Output

- 2D 游戏素材草图或半成品图
- 可选：透明底 PNG
- 可选：拆分后的独立 sprite 帧
- 可选：超分增强版

## Constraints

- 不承接 3D 模型、骨骼动画、长视频动画、完整场景地图设计
- sprite sheet 只适合概念级或简易动作帧，不保证严格逐帧动画工业标准
- 若用户要求“完全一致的角色多动作连续动画”，应明确这是高约束场景，建议先做角色定稿再分批生成
- 若用户未给尺寸单位，默认按视觉比例与可读性生成，不承诺像素级引擎规格

