---
name: meitu-id-photo
description: "用于基于用户原图制作规格化证件照、证件照换底色或单人写真套图。当用户要证件照、一寸照、二寸照、护照/签证照、白底/蓝底/红底证件版、写真照、三宫格写真、主题/场景写真时触发。不适用于多人合影、卡通化转绘、普通人像轻修。执行时会读取 Meitu 凭证、调用本地 `meitu` CLI，把人像照片、生成提示词与任务参数发送到 Meitu OpenAPI，并把结果写入本地输出目录。"
version: "1.2.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml","./DESIGN.md","~/.openclaw/workspace/visual/rules/quality.yaml","~/.openclaw/workspace/visual/memory/global.md","~/.openclaw/workspace/visual/memory/scenes/","~/.openclaw/workspace/visual/memory/observations/observations.yaml","$VISUAL/rules/quality.yaml","$VISUAL/memory/global.md","$VISUAL/memory/scenes/","$VISUAL/memory/observations/observations.yaml"],"write":["~/.openclaw/workspace/visual/","./DESIGN.md","./output/","~/.openclaw/workspace/visual/rules/quality.yaml","~/.openclaw/workspace/visual/memory/global.md","~/.openclaw/workspace/visual/memory/scenes/","~/.openclaw/workspace/visual/memory/observations/observations.yaml","$VISUAL/rules/quality.yaml","$VISUAL/memory/global.md","$VISUAL/memory/scenes/","$VISUAL/memory/observations/observations.yaml"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY","security":{"dataFlow":"Inputs, selected local context, generated prompts, and task parameters may be sent to Meitu OpenAPI when used by the workflow.","credentials":"Credentials are used only for CLI authentication and must not be disclosed.","persistence":"Record workflows may access declared project and visual memory/rules files."}}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "Portrait photos, ID photo parameters, portrait prompts, and generated prompts may be sent to Meitu OpenAPI."
  persistence: "Project mode may write output files and may update project or visual-memory files according to the Record workflow."
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

## Overview

本 skill 采用“证件照与写真套图”决策方式，但执行统一收敛到现有公开模板工具集：

- 标准证件照：`image-edit`
- 已有照片换证件底色：`image-edit`
- 单人写真 / 三宫格写真 / 主题场景写真：`image-portrait-generate`

核心原则只有两条：证件照求“规格准确、身份不漂移、不过度美化”，写真求“像本人、风格明确、摄影质感成立”。

执行前应让用户清楚知道：本 Skill 会读取 Meitu 凭证、调用本地 `meitu` CLI、将人像照片、生成提示词和任务参数发送到 Meitu OpenAPI，并把生成结果写入 `./output/` 或 `$VISUAL/output/meitu-id-photo/`。证件照场景只收集当前任务必需的信息，非必要不持久化姓名、性别或其他身份字段。

## Dependencies

- **meitu-cli** (>=2.0.6): `npm install -g meitu-cli@latest`
  - 首选环境变量：`MEITU_OPENAPI_ACCESS_KEY` / `MEITU_OPENAPI_SECRET_KEY`
  - 或预置凭证文件：`~/.meitu/credentials.json`
  - 如需人工初始化本地凭证，可显式执行 `meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`（会写入本地文件）
  - 验证：`meitu auth verify --json`
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight -> Intent Routing -> Execute -> Refine -> Deliver -> [Record]
```

### Preflight

1. `meitu --version` -> 未安装则提示 `npm install -g meitu-cli@latest`
2. `meitu auth verify --json` -> 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` -> project mode; else -> one-off
   检查 `$VISUAL` 目录 -> 确定 capabilities
   can_record = cwd 有 openclaw.yaml AND $VISUAL 存在（两者缺一即 false）
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml -> `./output/` | else -> `$VISUAL/output/meitu-id-photo/`
   `mkdir -p {output_dir}`

> **硬约束：** `{output_dir}` 禁止指向 skill 文件夹内部。output/ 永远在 skill 文件夹外部。
> Execute 中所有 `--download-dir {output_dir}` 使用此处解析的路径。

### Intent Routing

先判断用户要的是哪一类任务，只走一条路径：

| 用户需求 | 工具路径 |
|------|------|
| 标准证件照（指定规格） | `image-edit` |
| 已有证件照 / 人像只换白底蓝底红底 | `image-edit` |
| 写真照 / 艺术照 / 主题场景写真 | `image-portrait-generate` |
| 三宫格写真（同一人多 pose，同主题同服装） | `image-portrait-generate` |

边界：

- 多人合影 / 多主体场景重制：不由本 skill 处理
- 卡通化、插画化、3D 头像：转对应风格化能力
- 普通人像美化、局部修脸、轻修图：转通用人像修图能力

### Execute

#### 路径 A：标准证件照

适用条件：用户明确要一寸、二寸、护照、签证、身份证、驾照、入学、结婚证、工牌等标准规格，或者明确说“做证件照”。

执行规则：

1. 缺少照片 -> 提示上传正面单人人像
2. 用户只说“做证件照”没说规格 -> 追问规格，优先给常用选项：一寸 / 二寸 / 护照
3. 背景色未指定 -> 按规格默认背景推断；推断不出时默认白底
4. 证件照不追求美颜美型，只接受必要的换装、换底、合规裁切
5. 国家 / 平台规格冲突时必须先澄清，例如“中国一寸”和“美国签证照”不能混用

常用规格：

| 用途 | 尺寸 | 背景 |
|------|------|------|
| 中国普通一寸 | 25x35mm / 295x413px | 蓝 / 红 / 白 |
| 中国普通二寸 | 35x49mm / 413x579px | 蓝 / 红 / 白 |
| 中国护照 | 33x48mm / 390x567px | 白 |
| 美国签证 / 护照 | 51x51mm / 600x600px | 白 |
| 日本履历书 | 30x40mm | 白 |
| 工作证 / 学生证 | 22x32mm 或 25x35mm | 白 |

完整规格继续读取 [references/spec-database.md](references/spec-database.md)。

命令：

```bash
meitu image-edit \
  --skill_name skill_meitu-id-photo \
  --image_list {user_photo_url} \
  --prompt "{id_photo_prompt}" \
  --model praline_pro \
  --json \
  --download-dir {output_dir}
```

`{id_photo_prompt}` 是运行时生成的提示词，不是固定常量。模板要点：

- 写明规格尺寸、纯色背景、正面平视、半身或肩部以上构图
- 强调保持原五官身份特征，不改五官比例，不瘦脸，不放大眼睛
- 只允许做光线均匀化、服装替换、背景纯色替换和证件构图整理
- 避免“写真感”“高级感”“精致妆容”这类会把结果推向艺术写真的描述

示例 prompt：

`输出 {spec_name} 标准证件照，尺寸 {spec_size}，{color_name} 纯色背景，人物正面平视居中，肩部以上或标准半身证件构图，严格保持原五官身份特征与脸型比例，不做美颜美型，不瘦脸，不放大眼睛，不改变鼻子和嘴型，仅做光线均匀化、背景纯色替换、服装整理为 {attire_desc}，整体真实自然清晰。`

服装选择：

| 场景 | attire |
|------|------|
| 默认 | 深色正装外套搭配白色有领衬衫 |
| 男士职业照 | 深蓝色西装外套搭配白色有领衬衫和深色领带 |
| 女士职业照 | 黑色职业西装外套搭配白色圆领衬衫 |
| 用户自定义 | 按用户描述填写 |

#### 路径 B：证件照换底色

适用条件：用户已有一张基本合格的人像或证件照，只要求换成白底 / 蓝底 / 红底，不要求重新换装或大幅重构。

执行规则：

1. 只换背景，不主动改脸、不主动改身材、不主动做写真化处理
2. 输出不支持透明背景
3. 用户要求“换底同时重新换正装、重新裁规格” -> 改走路径 A

命令：

```bash
meitu image-edit \
  --skill_name skill_meitu-id-photo \
  --image_list {user_photo_url} \
  --prompt "{bg_replace_prompt}" \
  --model praline_pro \
  --json \
  --download-dir {output_dir}
```

`{bg_replace_prompt}` 是运行时生成的提示词。背景描述速查：

- 白底：`纯白色背景（#FFFFFF）均匀铺满`
- 蓝底：`纯蓝色背景（#438EDB）均匀铺满`
- 红底：`纯红色背景（#FF0000）均匀铺满`

示例 prompt：

`将人物背景替换为 {color_name} 纯色证件照背景，背景均匀干净，无杂物无渐变，严格保持人物五官身份特征、发型、表情、服装和构图不变，不美颜不瘦脸不改五官，只做背景替换与轻微光线均匀化，输出自然真实。`

#### 路径 C：单人写真 / 三宫格写真 / 主题写真

适用条件：用户要写真照、形象照、艺术照、主题场景写真、三宫格写真，而不是标准证件规格。

执行规则：

1. 以用户原图为身份基准，不做身份漂移
2. 写真要写清主题、场景、服装、光线和镜头气质，避免空泛词
3. 三宫格写真应一次生成同一画面内的三格构图，不拆成三张再拼
4. 默认走写实摄影质感，不转卡通、不做海报排版

命令：

```bash
meitu image-portrait-generate \
  --skill_name skill_meitu-id-photo \
  --image_list {user_photo_url} \
  --prompt "{portrait_prompt}" \
  --size 2K \
  --json \
  --download-dir {output_dir}
```

`{portrait_prompt}` 应根据用户主题动态生成：

- 普通写真：`soft studio portrait, natural skin texture, {theme}, {outfit}, {lighting}, keep facial identity`
- 主题写真：加入明确场景与摄影语言，如 `retro yearbook portrait`, `soft window light`, `vintage knitwear`
- 三宫格写真：写清 `vertical three-panel composition, same person, same outfit, three poses, consistent lighting`

### Refine

只根据用户指出的问题做最小修改：

| 反馈 | 调整 |
|------|------|
| 背景色不对 | 改背景 prompt 重跑 |
| 规格不对 | 改 `{spec_name}` 和对应尺寸描述重跑 |
| 服装不对 | 改 `attire_desc` 重跑 |
| 不像本人 | 建议换更正面、更清晰的原图 |
| 人物位置偏 | 原路径重跑一次 |
| 写真风格不够明确 | 补充主题 / 光线 / 服装 / 场景后重跑 |

不要在工具成功后主动做二次分析或自动复跑。用户满意前，建议最多迭代 3 轮。

### Deliver

output_dir 已在 Preflight 解析完毕，文件已由 `--download-dir` 下载到 `{output_dir}`。最终步骤返回 JSON 中 `downloaded_files[0].saved_path` 即为本地文件路径。Deliver 只做重命名：

```sh
mv "{downloaded_files[0].saved_path}" "{output_dir}/{date}_{output_label}.{ext}"
```

`{ext}` 取自 `downloaded_files[0].saved_path` 的实际扩展名。

命名建议：

- 证件照：`{YYYY-MM-DD}_{spec_name}_{color_name}.{ext}`
- 换底色：`{YYYY-MM-DD}_id-photo-bg-{color_name}.{ext}`
- 写真：`{YYYY-MM-DD}_portrait-set.{ext}`

交付说明：

- 标准证件照：说明规格和背景色，例如“二寸蓝底证件照”
- 换底色：说明新背景色
- 写真：说明主题和输出类型，例如“三宫格校园写真”

### Record（项目模式 MUST / 一次性模式跳过）

**前提：** can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）。不满足 -> 跳过全部记录，反馈仅当前对话有效。

**No feedback ->** 完全跳过，不读 observations.yaml，零开销。

**User approved style ->**
  read `$VISUAL/memory/observations/observations.yaml` -> scan similar key -> merge or append -> write back. `len(projects) >= 2` -> propose promotion (non-blocking)：
  > "顺便说一下，你在 N 个项目中都偏好 X。要保存吗？
  >   -> 保存到场景 [默认]
  >   -> 保存到全局偏好
  >   -> 不保存"
  User confirms -> write to `$VISUAL/memory/scenes/{scope}.md` 或 `global.md`，then delete observation key
  User ignores -> do nothing

**User rejected ("不要 XX") ->**
  has openclaw.yaml -> ask scope -> project: DESIGN.md Constraints / universal: quality.yaml（需用户确认）
  no openclaw.yaml -> current task only, write nothing

## Output

- **格式**：取自实际下载文件（通常 JPG）
- **命名**：按 Deliver 中的任务类型命名
- **位置**：由 Deliver 步骤决定

## Boundaries

本 skill 负责“证件照 / 证件底色替换 / 单人写真套图”三类任务，不做：

| 不做 | 说明 |
|------|------|
| 多人合影 / 多主体同框重制 | 非单人证件照 / 写真场景 |
| 卡通化 / 插画化 / 3D 头像 | 非摄影写实路径 |
| 普通人像轻修 / 局部磨皮 / 五官细修 | 非本 skill 主场景 |
| 海报设计 / 字体排版 | 非人像套图生成 |

判断准则：

- 用户意图是“做一张标准证件照” -> 路径 A（`image-edit`）
- 用户意图是“把这张证件照换成蓝底” -> 路径 B
- 用户意图是“做一组像本人的主题写真 / 三宫格写真” -> 路径 C
