---
name: meitu-id-photo
description: "生成标准证件照（一寸、二寸、护照、签证等）。自然美颜 + AI 重绘（换正装 + 纯色背景 + 规格裁剪）。当用户提到证件照、一寸照、二寸照、白底照片、蓝底照片、红底照片、passport photo、ID photo、签证照、驾照照片、身份证照、证件照换底色、证件照尺寸时触发。"
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

## Overview

接收一张人物照片，按指定证件照规格（尺寸 + 背景色）执行两步管线：自然美颜 → AI 重绘（换正装 + 纯色背景 + 规格裁剪）。无论原图穿什么衣服、戴不戴帽子，都通过 `image-edit` 一步重绘为标准正装证件照。

## Dependencies

- **meitu-cli** (>=0.1.9): `npm install -g meitu-cli`
  - 凭证配置：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 验证：`meitu auth verify --json`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context: 跳过] → Execute (规格确认 → 两步管线) → Refine → Deliver → [Record]
```

> **Context 跳过原因：** 证件照是标准化工具型管线（固定参数、官方规格），无创意自由度，不需要从 quality.yaml/global.md 加载审美偏好。

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
   can_record = cwd 有 openclaw.yaml AND $VISUAL 存在（两者缺一即 false）
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-id-photo/`
   `mkdir -p {output_dir}`

> **硬约束：** `{output_dir}` 禁止指向 skill 文件夹内部。output/ 永远在 skill 文件夹外部。
> Execute 中所有 `--download-dir {output_dir}` 使用此处解析的路径。

### Execute

**需求分析**

从用户输入中提取两个关键维度：

| 维度 | 如何确定 | 默认值 |
|------|---------|--------|
| **规格** | 用户指定名称（一寸、二寸、护照…）或具体尺寸 | 一寸（最常用） |
| **背景色** | 用户指定颜色名或 hex 值 | 白色 #FFFFFF |

**规格匹配逻辑**：

用户说"一寸照" → 匹配 `一寸`。用户说"护照照片" → 匹配 `中国护照`。用户说"美签照片" → 匹配 `美国护照/签证`。
用户说"蓝底二寸" → 规格=`二寸`，背景色=`蓝色`。
用户只说"证件照" → 问：需要什么规格？（列出常用选项：一寸/二寸/护照）

**背景色快捷匹配**：

| 用户表述 | 背景色 | Hex |
|---------|--------|-----|
| 白底/白色/身份证/护照/签证 | 白色 | #FFFFFF |
| 蓝底/蓝色/毕业证/工作证 | 蓝色 | #438EDB |
| 红底/红色/结婚证/党员证 | 红色 | #FF0000 |

用户未指定背景色 → read [references/spec-database.md](references/spec-database.md) § 中国标准尺寸 / 国际护照与签证，根据规格的"默认背景"列推断。推断不出则默认白色。

用户指定的规格未在上方快捷表中 → read [references/spec-database.md](references/spec-database.md) 查找完整规格（含像素、默认背景、触发词）。

**输入验证**

- **必须有照片**：未上传 → "请上传一张正面清晰的人物照片"
- **照片质量建议**：正面、五官清晰、光线均匀。侧脸/遮挡严重会影响效果
- **帽子/墨镜**：无需拒绝。`image-edit` 会在重绘时自动去掉帽子和墨镜，生成免冠证件照
- **仅支持单人**：beauty-enhance 限制单人。检测到多人 → 提示"证件照需要单人照片"

**规格确认**

向用户确认规格和背景色后再执行管线：

> 确认：一寸照（295×413px），白色背景
> 开始生成？

单一明确需求（如"帮我做一张蓝底二寸照"） → 可跳过确认，直接执行。

**两步管线**

管线顺序是**硬约束**，不可调换：

```
Step 1: image-beauty-enhance  自然美颜（可选，用户说"不要美颜"则跳过）
Step 2: image-edit            AI 重绘：换正装 + 纯色背景 + 构图裁剪（核心步骤）
```

**链式调用机制：** 中间步骤加 `--json`，解析返回 JSON 的 `media_urls[0]` 作为下一步的 `--image` 输入。最终步骤加 `--download-dir {output_dir}`（使用 Preflight 已解析的路径）。

---

**Step 1（可选）: 美颜 — image-beauty-enhance**

```bash
meitu image-beauty-enhance --image {user_photo_url} --beatify_type 0 --json
```

- `--beatify_type 0`：自然美颜（**证件照硬约束，绝不使用 1**）
- 效果：轻度磨皮去瑕疵、均匀肤色、微亮眼。保留皮肤纹理和真实面部结构
- **禁止操作**：瘦脸、大眼、改变五官 — 证件照必须与本人一致
- 解析：`ok: true` → `media_urls[0]` 传入下一步
- `ok: false` → 跳过美颜，用原图继续（美颜失败不阻塞管线）
- 用户明确说"不要美颜" → 跳过此步

---

**Step 2: AI 重绘 — image-edit（核心步骤）**

`image-edit` 使用 praline 模型一步完成：换正装、去帽/墨镜、换背景色、构图裁剪。

```bash
meitu image-edit \
  --image {input_url} \
  --prompt "{prompt}" \
  --model praline \
  --ratio {ratio} \
  --download-dir {output_dir}
```

**Prompt 构建规则**：

```
保持人物面部五官完全不变，免冠，{attire_desc}，
纯{color_name}色背景（{hex}），人物居中，正面直视镜头，表情自然端庄，
头部占画面约三分之二高度，头顶留适当空白，标准{spec_name}证件照风格
```

**服装描述 `{attire_desc}` 选择**：

| 场景 | attire_desc |
|------|-------------|
| 默认 / 未指定性别 | 穿着深色正装外套搭配白色有领衬衫，衣领整洁，肩部贴合自然 |
| 用户指定男士 | 穿着深蓝色西装外套搭配白色有领衬衫，系深色领带，衣领整洁 |
| 用户指定女士 | 穿着黑色职业西装外套搭配白色圆领衬衫，衣领整洁，肩部贴合自然 |
| 用户要求白衬衫（无外套） | 穿着白色有领衬衫，衣领整洁，无外套 |
| 用户自定义服装 | 按用户描述填写 |

> **关键原则：** prompt 必须包含"保持人物面部五官完全不变"以确保人脸一致性。服装描述要具体（颜色+款式+细节），避免泛泛的"正装"一词。

变量替换示例（一寸白底，默认正装）：
- `{attire_desc}` = 穿着深色正装外套搭配白色有领衬衫，衣领整洁，肩部贴合自然
- `{color_name}` = 白
- `{hex}` = #FFFFFF
- `{spec_name}` = 一寸
- `{ratio}` = 3:4

完整 prompt 示例：
```
保持人物面部五官完全不变，免冠，穿着深色正装外套搭配白色有领衬衫，衣领整洁，肩部贴合自然，
纯白色背景（#FFFFFF），人物居中，正面直视镜头，表情自然端庄，
头部占画面约三分之二高度，头顶留适当空白，标准一寸证件照风格
```

**--ratio 查表**：read [references/spec-database.md](references/spec-database.md) § `--ratio 映射表` 获取当前规格对应的 `--ratio` 值。

常用速查（完整表在 references）：

| 常用规格 | --ratio |
|---------|---------|
| 一寸/二寸/大一寸/小二寸/中国护照/欧盟签证 | 3:4 |
| 大二寸 | 2:3 |
| 身份证/英国护照 | 4:5 |
| 美国护照/日本签证 | 1:1 |

**Prompt 禁止语法**（meitu-cli 使用纯自然语言）：
- 禁止 `--ar`、`--no`、`(keyword:1.5)`、`<lora:xxx>`
- 比例通过 `--ratio` 参数传递，不写在 prompt 中

**背景色精度说明**：`image-edit` 是生成式模型，prompt 中的 hex 值为近似指导，实际出图颜色可能有偏差（如 #438EDB 可能偏天蓝）。对于需要像素级精准背景色的严格场景（如政府机构电子照片采集），应告知用户此限制，建议使用专业证件照软件做最终调色。

---

**错误降级策略**

每步独立处理，尽量不阻塞管线：

```
L1: 简化 prompt — 移除尺寸像素描述，只保留服装+背景色+居中指令
L2: 省略可选参数 — ratio 改为 auto
L3: 跳过美颜 — 美颜失败用原图继续
L4: 编辑失败 → 简化服装描述重试（只保留"穿着正装"），仍失败则交付原图并说明
L5: 首步即失败 → 检查凭证/余额，报错含 code + hint
```

特殊错误码：
- `ORDER_REQUIRED` → 提示用户充值，提供 action_url
- `CREDENTIALS_MISSING` → 提示配置 AK/SK

### Refine

**结果呈现**：
- 展示生成的证件照
- 说明规格和背景色："一寸白底证件照（295×413px）"
- 不暴露完整 prompt

**反馈分类与处理**：

| 反馈类型 | 调整方式 | 示例 |
|----------|----------|------|
| 背景色不对 | 修改 prompt 中的颜色值，重跑 Step 2 | "要蓝底不是白底" → 改 hex 重新编辑 |
| 尺寸不对 | 修改规格参数，重跑 Step 2 | "要二寸的" → 更换规格重新编辑 |
| 服装不满意 | 修改 attire_desc，重跑 Step 2 | "换白衬衫不要外套" → 调整服装描述 |
| 不像本人 | 在 prompt 中加强面部保留描述，重跑 Step 2 | "不太像我" → 强调面部不变 |
| 美颜过度/不够 | 跳过美颜或说明限制 | "不要美颜" → 跳过 Step 1 重跑 |
| 人物位置偏 | 调整 prompt 中的位置描述，重跑 Step 2 | "头太偏上了" → 修改构图指令 |
| 换张照片 | 从 Step 1 重新开始 | "用另一张" → 全管线重跑 |
| 满意 | 进入 Deliver | "可以" / "不错" |

**迭代节奏**：
- 每轮只调整用户反馈涉及的步骤，不重跑全管线
- 背景色/尺寸/服装调整只需重跑 Step 2（最快）
- 建议最多 3 轮迭代
- 超过 3 轮 → 建议换一张照片或调整期望

### Deliver

output_dir 已在 Preflight 解析完毕，文件已由 `--download-dir` 下载到 `{output_dir}`。最终步骤返回 JSON 中 `downloaded_files[0].saved_path` 即为本地文件路径。Deliver 只做重命名：

```bash
mv "{downloaded_files[0].saved_path}" "{output_dir}/{date}_{spec_name}_{color_name}.{ext}"
```

`{ext}` 取自 `downloaded_files[0].saved_path` 的实际扩展名。

命名示例：`2026-03-23_二寸_蓝底.jpg`、`2026-03-23_美国护照_白底.png`

### Record（项目模式 MUST / 一次性模式跳过）

**前提：** can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）。不满足 → 跳过全部记录，反馈仅当前对话有效。

**No feedback →** 完全跳过，不读 observations.yaml，零开销。

**User approved style →**
  read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back. `len(projects) >= 2` → propose promotion (non-blocking)：
  > "顺便说一下，你在 N 个项目中都偏好 X。要保存吗？
  >   → 保存到场景 [默认]
  >   → 保存到全局偏好
  >   → 不保存"
  User confirms → write to `$VISUAL/memory/scenes/{scope}.md` 或 `global.md`，then delete observation key
  User ignores → do nothing

**User rejected ("不要 XX") →**
  has openclaw.yaml → ask scope → project: DESIGN.md Constraints / universal: quality.yaml（需用户确认）
  no openclaw.yaml → current task only, write nothing

## Output

- **格式**：取自实际下载文件（通常 JPG）
- **命名**：`{YYYY-MM-DD}_{规格名}_{背景色}.{ext}`
- **位置**：由 Deliver 步骤决定

## Boundaries

本 skill 只做**证件照生成**——标准化的美颜+AI重绘（换正装+背景+裁剪）。不做：

| 不做 | 转交 |
|------|------|
| 艺术写真 / AI 写真 / 风格照 | `meitu-portrait` |
| 通用修图 / 去水印 / 超清 | `meitu-image-fix` |
| 海报设计 / 排版 | `meitu-poster` |
| 创意换背景（非纯色） | `meitu-portrait` 或 `meitu-image-fix` |

**边界判断**：用户意图是"做一张标准证件照" → 本 skill。用户意图是"把照片背景换成风景" → 告知不是证件照场景，建议对应 skill。
