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

接收一张人物照片，按指定证件照规格（尺寸 + 背景色）调用 `image-id-photo-generate` 一步生成标准证件照。无论原图穿什么衣服、戴不戴帽子，都通过 CLI 的证件照专用命令完成换装、换背景和规格裁剪。

## Dependencies

- **meitu-cli** (>=2.0.6): `npm install -g meitu-cli@latest`
  - 凭证配置：`meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 验证：`meitu auth verify --json`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → [Context: 跳过] → Execute (规格确认 → 两步管线) → Refine → Deliver → [Record]
```

> **Context 跳过原因：** 证件照是标准化工具型管线（固定参数、官方规格），无创意自由度，不需要从 quality.yaml/global.md 加载审美偏好。

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli@latest`
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

**单步专用命令**

`2.0.6` 中证件照场景已收敛到专用命令 `image-id-photo-generate`，不再依赖旧的“美颜 + image-edit”两步串联。

```bash
meitu image-id-photo-generate \
  --skill_name skill_meitu-id-photo \
  --image_url {user_photo_url} \
  --spec_type "{spec_name}" \
  [--bg_color "{color_name}"] \
  [--attire "{attire_desc}"] \
  --json \
  --download-dir {output_dir}
```

参数说明：

| 参数 | 作用 | 说明 |
|------|------|------|
| `--image_url` | 输入人像照片 | 必填，正面单人人像 |
| `--spec_type` | 证件照规格 | 必填，如一寸、二寸、中国护照、美国护照等 |
| `--bg_color` | 背景色 | 可选，常见取值白色/蓝色/红色 |
| `--attire` | 服装描述 | 可选，CLI 会在证件照专用流程中执行换装 |

服装描述 `{attire_desc}` 选择：

| 场景 | attire_desc |
|------|-------------|
| 默认 / 未指定性别 | 深色正装外套搭配白色有领衬衫 |
| 用户指定男士 | 深蓝色西装外套搭配白色有领衬衫和深色领带 |
| 用户指定女士 | 黑色职业西装外套搭配白色圆领衬衫 |
| 用户要求白衬衫（无外套） | 白色有领衬衫，无外套 |
| 用户自定义服装 | 按用户描述填写 |

常用规格和背景色仍然从 [references/spec-database.md](references/spec-database.md) 获取；这里只把执行命令切换为 `image-id-photo-generate`。

---

**错误降级策略**

围绕单个命令做降级：

```
L1: 简化 attire — 将自定义服装收敛为“深色正装外套搭配白色有领衬衫”
L2: 省略可选参数 — 去掉 `bg_color` / `attire`，仅保留 `image_url + spec_type`
L3: 切换到规格默认背景色 — 用户给了非常规颜色时回退到该规格默认底色
L4: 仍失败 → 交付原图并说明证件照专用生成失败
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
| 背景色不对 | 修改 `bg_color`，重跑专用命令 | "要蓝底不是白底" → 改为蓝底重跑 |
| 尺寸不对 | 修改 `spec_type`，重跑专用命令 | "要二寸的" → 更换规格重新生成 |
| 服装不满意 | 修改 `attire`，重跑专用命令 | "换白衬衫不要外套" → 调整服装描述 |
| 不像本人 | 说明换一张更正面、更清晰的人像照再重跑 | "不太像我" → 建议换图 |
| 人物位置偏 | 重新生成，并提示证件照专用模型会重新裁剪 | "头太偏上了" → 重新生成 |
| 换张照片 | 重新从专用命令开始 | "用另一张" → 全流程重跑 |
| 满意 | 进入 Deliver | "可以" / "不错" |

**迭代节奏**：
- 每轮只调整用户反馈涉及的参数，不必恢复旧的两步管线
- 背景色/尺寸/服装调整都只需重跑 `image-id-photo-generate`
- 建议最多 3 轮迭代
- 超过 3 轮 → 建议换一张照片或调整期望

### Deliver

output_dir 已在 Preflight 解析完毕，文件已由 `--download-dir` 下载到 `{output_dir}`。最终步骤返回 JSON 中 `downloaded_files[0].saved_path` 即为本地文件路径。Deliver 只做重命名：

```sh
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
