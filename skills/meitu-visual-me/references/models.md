# Meitu Visual Me Capability Reference (aligned with meitu-cli >= 2.0.6)

## Capability Overview

| Capability | Command | Description |
|------|------|------|
| Text-to-image | `meitu text-to-image` | 纯文本生图，可选参考图融合 |
| Image editing | `meitu image-edit` | Prompt 驱动的通用编辑：消除 / 重绘 / 扩展 / 换背景 / 多图融合 / 加文字 / 美颜 等 |
| Style transfer | `meitu image-style-transfer` | 风格化（卡通 / 3D / 动漫 / 水墨 / 油画 等） |
| Super-resolution | `meitu image-superres-enhance` | 自动超清/超分 |
| Smart cutout | `meitu image-cutout` | 透明底 / 白底抠图，由 prompt 描述主体 |
| Face swap | `meitu image-face-swap` | 双图换脸 |
| Outfit swap | `meitu image-outfit-swap` | 虚拟换装（旧名 `image-try-on`，已重命名） |
| Image-to-video | `meitu image-to-video` | 图生视频，2-12s 短视频，异步 |
| Text-to-video | `meitu text-to-video` | 文生视频，5/10s，异步 |
| Motion transfer | `meitu video-motion-transfer` | 视频动作迁移，异步 |
| Video to GIF | `meitu video-to-gif` | 视频转 GIF |
| Poster generation | `meitu image-poster-generate` | 含文字排版的海报 |
| Grid split | `meitu image-grid-split` | 宫格图自动拆分 |

> All commands support `--download-dir` 与 `--json`。

> **Note:** 旧版命令名 `image-generate` / `image-upscale` / `image-beauty-enhance` / `image-try-on` 在 2.0.x 已废弃或合并入上面的能力。本 skill 的 17 个 workflow 主要用上述能力中的 7 个；其余命令可直接调用，参数表见下文。

---

## Text-to-Image · `meitu text-to-image`

最常用能力，覆盖纯文本生图与可选参考图融合两类场景。

```bash
# 纯文本生图
meitu text-to-image --prompt "赛博朋克风格的城市夜景"

# 带参考图
meitu text-to-image --image_list "参考图URL" --prompt "将照片转为水彩画风格" --size 2k

# 多张参考图
meitu text-to-image --image_list "图片URL1" "图片URL2" --prompt "合影风格化"

# 指定比例并输出 JSON
meitu text-to-image --prompt "微缩场景" --ratio 1:1 --json

# 输出 JSON 与下载目录
meitu text-to-image --prompt "微缩场景" --json --download-dir ./output
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--prompt PROMPT` | Required | Prompt 文本 |
| `--image_list IMAGE_LIST...` | Optional | 参考图 URL 数组（别名 `--image` / `--image_url`） |
| `--model MODEL` | Optional | `auto`(默认) / `gummy` / `praline_pro` / `nougat` |
| `--size SIZE` | Optional | `2k` / `3k` / `WIDTHxHEIGHT`（如 `1024x768`），默认 `2k`。**注意：** 与 `image-poster-generate` 的 `1K`/`2K`/`4K` 大小写不同 |
| `--ratio RATIO` | Optional | `1:1` / `4:3` / `3:4` / `16:9` / `9:16` / `3:2` / `2:3` / `21:9` |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

> `image_list` 与 `ratio` 互斥：传 `image_list` 时不要再传 `ratio`。需要参考图又要改画幅时，先生成，再用 `image-edit` 做比例适配更稳妥。

---

## Image Editing · `meitu image-edit`

用 prompt 自然语言描述编辑操作，覆盖消除 / 重绘 / 扩展 / 换背景 / 多图融合 / 加文字 / 人像编辑（含美颜）等。

```bash
# 消除路人
meitu image-edit --image_list "图片URL" --prompt "消除画面中的路人"

# 重绘
meitu image-edit --image_list "图片URL" --prompt "将背景替换为海边日落"

# 扩展画面（带 ratio）
meitu image-edit --image_list "图片URL" --prompt "扩展画面" --ratio 16:9

# 多图融合
meitu image-edit --image_list "图片URL1" "图片URL2" --prompt "统一色调风格"

# 人像美颜（旧版 image-beauty-enhance 已合并入本命令）
meitu image-edit --image_list "图片URL" --prompt "自然磨皮、提亮肤色，保留五官真实" --model gummy_pro
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_list IMAGE_LIST...` | Required | 图片 URL 数组（别名 `--image` / `--image_url`） |
| `--prompt PROMPT` | Required | 编辑指令 prompt |
| `--model MODEL` | Optional | `auto`(默认推荐) / `gummy_pro`(人像编辑) / `praline_pro`(多图/商品/文字渲染) / `praline_lite`(降级) / `mint_edit`(兜底) |
| `--ratio RATIO` | Optional | `auto` / `1:1` / `2:3` / `3:2` / `3:4` / `4:3` / `4:5` / `5:4` / `9:16` / `16:9` / `21:9`，默认 `auto` |
| `--size SIZE` | Optional | size |
| `--output_format` | Optional | output_format |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

**Usage note:** 没有 `--mode` 参数。所有编辑操作（消除 / 重绘 / 扩展 / 换背景 / 加文字 / 美颜 等）都通过 `--prompt` 自然语言描述。

**Model Selection Guide:**

| Model | 后端 sub_api | 何时用 |
|-------|--------------|-------|
| `auto`（默认） | 由 selection_rule 自动路由 | 不确定时优先用 |
| `gummy_pro` | `image_gummy_edit_v45` | 人像编辑（人脸 / 表情 / 妆容 / 发型 / 肤色 / 姿态 / 五官） |
| `praline_pro` | `image_praline_edit_v2` | 多图融合 / 一致性 / 商品出图 / 加文字 / 通用编辑 |
| `praline_lite` | `image_praline_edit_2` | praline_pro 失败时降级 |
| `mint_edit` | `image_mint_edit` | 最终兜底 |
| `nougat` | `image_nougat_edit` | 显式指定的高质量编辑路径；更适合少量高质量创意编辑，不走自动路由 |

> 当前对外模型名以 `gummy_pro` / `praline_pro` / `praline_lite` / `mint_edit` / `nougat` 为准；旧版 `gummy` / `praline` 仍视为过时叫法。默认风格化优先走 `image-style-transfer`，需要显式高质量编辑时可使用 `image-edit --model nougat`。

**Ratio constraints by model（服务端约束）：**
- `praline_pro` / `praline_lite` / `mint_edit`：auto/1:1/2:3/3:2/3:4/4:3/4:5/5:4/9:16/16:9/21:9
- `gummy_pro`：auto/1:1/4:3/3:4/16:9/9:16/3:2/2:3/21:9

---

## Style Transfer · `meitu image-style-transfer`

把已有图风格化（卡通 / 3D / 动漫 / 水墨 / 油画 / 像素 等）。默认优先走本命令；如需显式控制高质量编辑链路，当前也可用 `image-edit --model nougat`。

```bash
meitu image-style-transfer --image_url "图片URL" --prompt "Japanese anime portrait, soft lighting" --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_url IMAGE_URL` | Required | 图片 URL（别名 `--image`） |
| `--prompt PROMPT` | Required | 目标风格描述 |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

---

## Super-Resolution · `meitu image-superres-enhance`

自动超分，不需要手动指定倍数。**旧名 `image-upscale` 已废弃。**

```bash
meitu image-superres-enhance --image_url "图片URL" --prompt "general image clarity enhancement"

meitu image-superres-enhance --image_url "图片URL" --prompt "e-commerce white-background product" --json --download-dir ./output

meitu image-superres-enhance --image_url "图片URL" --prompt "scanned text document" --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_url IMAGE_URL` | Required | 图片 URL（别名 `--image`） |
| `--prompt PROMPT` | **Required** | 图片内容描述，用于路由到合适的超分算法（如 `\\"e-commerce white-background product\\"` / `\\"scanned text document\\"` / `\\"general image clarity enhancement\\"`） |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

> 没有 `--scale` 也没有 `--model_type` 参数。系统自动判定并完成超分。`--prompt` 是 CLI 强制必填项（2.0.6 起），不传会直接报 `error: required option '--prompt <value>' not specified`。

---

## Smart Cutout · `meitu image-cutout`

支持人像 / 商品 / 图形 / 通用主体抠图。透明底 PNG 默认；prompt 中加 `white background` 可输出白底图。

```bash
# 人像
meitu image-cutout --image_url "图片URL" --prompt "person"

# 商品（具体品类比泛词更精准）
meitu image-cutout --image_url "图片URL" --prompt "running shoe"

# 白底
meitu image-cutout --image_url "图片URL" --prompt "product on white background"
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_url IMAGE_URL` | Required | 图片 URL（别名 `--image`） |
| `--prompt PROMPT` | Required | 主体描述（路由用，越具体越好） |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

> 没有 `--model_type` 参数（已废弃）。主体类型由 prompt 描述，由后端自动路由 `api_v1_sod_async`（透明底）或 `image_praline_edit_v2`（白底）。

**Usage note:** 抠图输出透明底 PNG。**换背景不需要先抠图** —— 直接 `image-edit` 一步出更好（见 workflow 11）。

---

## Face Swap · `meitu image-face-swap`

用于头像系列、头像替换等场景。

```bash
meitu image-face-swap \\
  --head_image_url "头部参考图URL" \\
  --sence_image_url "场景参考图URL" \\
  --prompt "自然融合，保持光影一致"
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--head_image_url HEAD_IMAGE_URL` | Required | 头部参考图 URL |
| `--sence_image_url SENCE_IMAGE_URL` | Required | 场景参考图 URL（注意拼写是 `sence` 不是 `scene`） |
| `--prompt PROMPT` | Required | Prompt 文本 |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

---

## Virtual Outfit Swap · `meitu image-outfit-swap`

虚拟换装。**旧名 `image-try-on` 已重命名。** 参数也已简化。

```bash
# 基础用法（人物图必填，prompt 描述目标穿搭）
meitu image-outfit-swap \\
  --image_url "人物图片URL" \\
  --prompt "把外套换成米白色羊绒大衣"

# 带服装参考图
meitu image-outfit-swap \\
  --image_url "人物图片URL" \\
  --clothes_image_url "衣服图片URL" \\
  --prompt "穿上参考图中的衣服"
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_url IMAGE_URL` | Required | 人物图片 URL（别名 `--image`） |
| `--prompt PROMPT` | Required | 目标穿搭描述 |
| `--clothes_image_url CLOTHES_IMAGE_URL` | Optional | 服装参考图 URL |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

> 旧版 `--person_image_url` / `--replace` / `--need_sd` 在 2.0.x **不再被接受**。要换的部位、风格、是否超分都通过 prompt 表达。

---

## Image to Video · `meitu image-to-video`

异步任务；从图片 + 描述生成短视频。

```bash
# 基础
meitu image-to-video \\
  --image_list "图片URL" \\
  --prompt "人物缓缓转头微笑"

# 指定时长与比例
meitu image-to-video \\
  --image_list "图片URL1" "图片URL2" \\
  --prompt "两个场景切换过渡" \\
  --video_duration 8 \\
  --aspect_ratio 16:9

# 输出 JSON
meitu image-to-video --image_list "图片URL" --prompt "花瓣飘落" --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_list IMAGE_LIST...` | Required | 图片 URL 数组（**仅接受 `--image_list`，不接受 `--image_url` / `--image` 别名**） |
| `--prompt PROMPT` | Required | 动作/镜头描述 |
| `--video_duration VIDEO_DURATION` | Optional | 2-12 秒，默认 5 |
| `--aspect_ratio ASPECT_RATIO` | Optional | `adaptive` / `16:9` / `4:3` / `1:1` / `3:4` / `9:16` / `21:9`，默认 `adaptive` |
| `--resolution RESOLUTION` | Optional | 分辨率档位 |
| `--sound SOUND` | Optional | `on` / `off` |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

---

## Motion Transfer · `meitu video-motion-transfer`

异步任务；把参考视频的动作迁移到目标人物图上。

```bash
meitu video-motion-transfer \\
  --image_list "目标人物图片URL" \\
  --reference_video_list "动作参考视频URL" \\
  --prompt "保持人物外观，迁移舞蹈动作"
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_list IMAGE_LIST...` | Required | 目标人物图 URL（别名 `--image_url`） |
| `--reference_video_list VIDEO_URL...` | Required | 动作参考视频 URL（别名 `--video_url`） |
| `--prompt PROMPT` | Required | Prompt 文本 |
| `--video_duration` | Optional | 视频时长 |
| `--aspect_ratio` | Optional | 比例 |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

---

## Portrait Beauty Enhance（已合并入 image-edit）

**旧版 `image-beauty-enhance` 在 2.0.x 已合并入 `image-edit`，没有独立命令。** 美颜/磨皮/提亮通过 `image-edit + --model gummy_pro` 实现：

```bash
# 自然美颜
meitu image-edit \\
  --image_list "图片URL" \\
  --prompt "自然磨皮、轻提亮肤色，保留五官真实纹理" \\
  --model gummy_pro \\
  --json

# 强力美颜
meitu image-edit \\
  --image_list "图片URL" \\
  --prompt "重度磨皮提亮，皮肤光滑通透" \\
  --model gummy_pro \\
  --json
```

**Usage note:** 单人图片为主；多人合影建议拆开逐人处理。

---

## Text to Video · `meitu text-to-video`

纯文本电影感视频生成，含丰富镜头语言与环境音。异步任务。

```bash
meitu text-to-video --prompt "清晨的森林，阳光穿过树叶洒落"

meitu text-to-video --prompt "赛博朋克城市街道，霓虹灯闪烁" --video_duration 10 --sound on --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--prompt PROMPT` | Required | 视频描述 prompt |
| `--video_duration VIDEO_DURATION` | Optional | `5` / `10` 秒，默认 `5` |
| `--sound SOUND` | Optional | `on` / `off`，默认 `off` |
| `--aspect_ratio` | Optional | 比例 |
| `--resolution` | Optional | 分辨率 |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

---

## Video to GIF · `meitu video-to-gif`

视频转 GIF，最大长边 480px。

```bash
meitu video-to-gif --video_url "视频URL" --prompt "natural loop" --json --download-dir ./output
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--video_url VIDEO_URL` | Required | 视频 URL（别名 `--video`） |
| `--prompt PROMPT` | **Required** | 视频内容描述（用户要求透明底/表情包且画面背景纯净时输出 240×240 透明 GIF；其他情形输出 ≤480px 标准 GIF） |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

> 旧版 `--image` / `--wechat_gif` 已废弃；输入用 `--video_url`，是否微信表情格式由后端按内容自动判定。`--prompt` 是 CLI 强制必填项（2.0.6 起）。

---

## Poster Generation · `meitu image-poster-generate`

含文字排版的海报，支持中英文，适合宣传与广告位。

```bash
# 纯文本生海报
meitu image-poster-generate --prompt "夏日清仓大促，全场五折起"

# 带参考图
meitu image-poster-generate --prompt "新品发布会邀请函" --image_list "参考图URL" --ratio 9:16 --size 2K

# 指定模型与输出格式
meitu image-poster-generate --prompt "咖啡店开业海报" --model Nougat --output_format png --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--prompt PROMPT` | Required | 海报描述 prompt |
| `--image_list IMAGE_LIST...` | Optional | 参考图 URL 数组（别名 `--image` / `--image_url`） |
| `--model MODEL` | Optional | `Praline_2`(默认) / `Gummy` / `Nougat` / `PralineV2` / `GummyV4.5`（**首字母大写**，与 image-edit 不同） |
| `--size SIZE` | Optional | `auto` / `512` / `1K` / `2K` / `4K`，默认 `auto` |
| `--ratio RATIO` | Optional | `auto` / `1:1` / `1:3` / `3:1` / `2:1` / `1:2` / `3:2` / `2:3` / `4:3` / `3:4` / `4:5` / `5:4` / `9:16` / `16:9`，默认 `auto` |
| `--output_format` | Optional | `jpeg` / `png` / `webp`，默认 `png` |
| `--enhance_prompt` | Optional | 是否扩写 prompt，默认 `false` |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

---

## Grid Split · `meitu image-grid-split`

把宫格拼接图自动拆成多张独立图片，目前支持 2x2 四宫格。

```bash
meitu image-grid-split --image_url "网格图URL" --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_url IMAGE_URL` | Required | 网格图 URL（别名 `--image`） |
| `--download-dir` | Optional | 下载目录 |
| `--json` | Optional | JSON 输出 |

---

## Workflow-to-Capability Mapping

| Workflow | Primary command | Notes |
|----------|---------|------|
| Text-to-image（微缩 / 今日卡 / 晨间四宫格 等） | `text-to-image --prompt "..."` | 纯文本生图 |
| Stylization（变画风） | `image-style-transfer --image_url "ref" --prompt "..."` | 默认入口；如需显式高质量编辑链路，可改用 `image-edit --model nougat` |
| Background swap（一句话换背景） | `image-edit --image_list "original" --prompt "Keep the person the same, change background to ..."` | 一步出，无需先抠图 |
| Avatar series | `text-to-image` + `image-face-swap` | 生成基底 + 换脸 |
| Multi-platform adaptation | `image-edit --ratio <target ratio> --prompt "..."` | 通过比例适配 |
| ID card | `text-to-image --prompt "..."` | 文生证件卡风 |
| Group photo | `text-to-image --image_list "img1" "img2" --prompt "..."` | 多参考图合影 |
| Virtual outfit swap | `image-outfit-swap --image_url "person" [--clothes_image_url "clothes"] --prompt "..."` | 旧 image-try-on 已重命名 |
| Image to short video | `image-to-video --image_list "..." --prompt "..."` | 图生视频 |
| Motion transfer | `video-motion-transfer --image_list "person" --reference_video_list "ref" --prompt "..."` | 视频动作迁移 |
| Portrait beauty | `image-edit --image_list "..." --prompt "natural skin smoothing..." --model gummy_pro` | 旧 image-beauty-enhance 已合并入 image-edit |
| Text to video | `text-to-video --prompt "..."` | 无图输入 |
| Video to GIF | `video-to-gif --video_url "..."` | 视频输入 |
| Poster generation | `image-poster-generate --prompt "..."` | 含文字排版 |
| Grid split | `image-grid-split --image_url "..."` | 宫格图输入 |

---

## Calling Conventions

1. **所有命令加 `--json`** — 拿可解析输出
2. **检查 `ok` 字段** — `true` 成功；`false` 先看 CLI 原始字段 `code`、`hint`、`error_name`、`action_url`
3. **对用户展示失败时** — 按 `meitu-tools` 的映射规则把 CLI 原始错误归类为 `error_type`、`user_hint`、`next_action`、`action_link`
4. **正确取结果** — 没有 `--download-dir`：用 `media_urls[0]`；有 `--download-dir`：用 `downloaded_files[0].saved_path`（本地路径，更可靠）。注意：`saved_path` 是绝对路径；展示给用户时格式化为 `~/.openclaw/...`
5. **图片输入支持本地路径与 URL** — CLI 内部自动上传
6. **face-swap 拼写** — 是 `sence_image_url` 不是 `scene`
7. **image-edit 没 `--mode`** — 编辑操作通过 prompt 描述
8. **image-superres-enhance 没 `--scale`** — 自动超分；旧名 `image-upscale` 已废弃
9. **参数别名** — 多数命令兼容 `--image` / `--image_list` / `--image_url`，但文档与自动化里优先使用各工具的 canonical 参数名（如 `text-to-image` / `image-edit` / `image-to-video` 用 `--image_list`，`image-cutout` / `image-style-transfer` 用 `--image_url`）
10. **凭证检查** — `meitu auth verify --json` 不耗 API quota
11. **旧命令对照表（迁移指南）：**
   - `image-generate` → `text-to-image`
   - `image-upscale` → `image-superres-enhance`
   - `image-beauty-enhance` → `image-edit --model gummy_pro` + 美颜 prompt
   - `image-try-on` → `image-outfit-swap`（参数也简化了）
   - `meitu login` → `meitu config set-ak / set-sk` 或 env vars

