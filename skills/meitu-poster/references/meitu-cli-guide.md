# Meitu CLI Reference (aligned with meitu-cli ≥ 2.0.6)

meitu-cli 命令摘要。完整 API 详见已安装的 `meitu-cli` 文档（`meitu --help` / `meitu <command> --help`）。

---

## Execution Pattern

All commands 通过 `meitu` CLI 直接调用，加 `--json` 获取结构化输出：

```bash
meitu <command> [options] --json --download-dir ./output/
```

- `--json` → 输出 JSON（含 URL、task_id 等）
- `--download-dir` → 自动下载生成结果到指定目录
- 异步命令（`image-to-video`、`text-to-video`、`video-motion-transfer` 等）CLI 自动轮询等待

**Install:** `npm install -g meitu-cli@latest`，然后配置凭证：

- 环境变量（推荐）：`MEITU_OPENAPI_ACCESS_KEY` + `MEITU_OPENAPI_SECRET_KEY`
- 或本地配置：`meitu config set-ak <ACCESS_KEY>` + `meitu config set-sk <SECRET_KEY>`（写入 `~/.meitu/credentials.json`，权限 0600）

---

## Install (when manual setup needed)

```bash
npm install -g meitu-cli@latest
meitu --version
```

Credentials (pick one):

- Env vars (CI/agent 推荐):
  ```bash
  export MEITU_OPENAPI_ACCESS_KEY="..."
  export MEITU_OPENAPI_SECRET_KEY="..."
  ```
- Local config (人工开发机):
  ```bash
  meitu config set-ak "<ACCESS_KEY>"
  meitu config set-sk "<SECRET_KEY>"
  ```
- 直接编辑 `~/.meitu/credentials.json`：`{"accessKey":"...","secretKey":"..."}`

验证：`meitu auth verify --json` → `{"ok": true, ...}`。

---

## Capability Catalog

CLI 当前共 40 个 effect 命令（详见 `meitu-tools/references/tools.yaml`）。本文按 poster workflow 中常用的子集列出，所有命令都接受 `--json` / `--download-dir` / `--output`。

### Image Generation

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `text-to-image` | 纯文本生图，可选参考图 | `prompt` | `image_list`, `size`, `ratio`, `model` |
| `image-poster-generate` | 含文字排版的海报（中英文） | `prompt` | `image_list`, `model`, `size`, `ratio`, `output_format`, `enhance_prompt` |
| `image-portrait-generate` | 高保真人像/宠物像生成 | `image_list`, `prompt` | `size` |
| `image-id-photo-generate` | 标准证件照 | `image_url`, `spec_type` | `bg_color`, `attire`, `face_desc` |

### Image Editing

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-edit` | 通用图生图编辑（电商/人像/多图融合/换背景/加文字 等 5 大场景） | `image_list`, `prompt` | `model` (auto/Gummy/Nougat/PralineV2/GummyV4.5/Praline_2), `ratio`, `size`, `output_format` |
| `image-face-swap` | 双图换脸 | `head_image_url`, `sence_image_url`, `prompt` | — |
| `image-outfit-swap` | 换装 (旧名 image-try-on，已重命名) | `image_url`, `prompt` | `clothes_image_url` |
| `image-style-transfer` | 风格化（动漫/油画/水彩/3D/像素 等） | `image_url`, `prompt` | — |
| `image-background-replace` | 换背景/换场景/证件照底色 | `image_url` | `prompt` (默认白底) |
| `image-text-replace` | 替换图中文字内容 | `image_url`, `prompt` | — |
| `image-element-remove` | 去水印/去文字/去局部物体 | `image_url` | `target` (watermark/text), `prompt` |

### Image Tools / Enhance

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-cutout` | 抠图（透明底 PNG / 白底图） | `image_url`, `prompt` | — |
| `image-grid-split` | 宫格图自动拆分成多张 | `image_url` | — |
| `image-transform` | 比例适配/外扩 outpainting | `image_url`, `prompt` | `ratio` |
| `image-superres-enhance` | 超清/超分 (旧名 image-upscale，已重命名) | `image_url`, `prompt` | — |
| `image-lowlight-enhance` | 暗光增强/夜景修复 | `image_url` | — |
| `image-denoise-enhance` | 降噪 | `image_url` | — |
| `image-search` | 图搜图 / 关键词图搜 | `prompt` 或 `image_ids` | `query_mode`, `size`, `source_type` |

### Video

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-to-video` | 图生视频（异步） | `image_url`, `prompt` | `video_duration`, `aspect_ratio`, `resolution`, `sound` |
| `text-to-video` | 文生视频（异步） | `prompt` | `video_duration`, `sound`, `aspect_ratio`, `resolution` |
| `video-motion-transfer` | 动作迁移（异步） | `image_list`, `reference_video_list`, `prompt` | `video_duration`, `aspect_ratio` |
| `video-multimodal-generate` | 多模态混合视频生成 | `prompt` | `image_list`, `reference_video_list`, `reference_audio_list`, `video_duration`, `sound` |
| `video-to-gif` | 视频转 GIF（标准 / 透明底） | `video_url`, `prompt` | — |

> 旧版命令名 `image-generate` / `image-upscale` / `image-beauty-enhance` / `image-try-on` 在 2.0.x 已废弃或合并入上面对应能力。`meitu login` 不再支持，凭证走 env/`meitu config`。

---

## Critical: image-edit Model Selection

`image-edit` 通过 `--model` 选 sub_api，不传或 `auto` 时由后端自动路由（推荐）。可选值：

| Model | 对应 sub_api | When to use |
|-------|-------------|-------------|
| `auto` (默认) | 由后端 selection_rule 路由 | 不确定时直接交给 auto |
| `gummy_pro` | `image_gummy_edit_v45` | 人像编辑（人脸/表情/妆容/发型/肤色/姿态/五官） |
| `praline_pro` | `image_praline_edit_v2` | 多图融合 / 一致性 / 通用编辑 / 电商商品出图 / 文字渲染 |
| `praline_lite` | `image_praline_edit_2` | praline_pro 失败时的降级 |
| `mint_edit` | `image_mint_edit` | 最终兜底 |

**Decision guide:**

- 人像类编辑（脸 / 妆容 / 发型 / 肤色 / 五官）→ `gummy_pro`
- 多图融合 / 商品图 / 加文字 / 一致性 → `praline_pro`
- 风格化（卡通/3D/动漫/水墨）→ 走专门的 **`image-style-transfer`** 命令，不要再用 image-edit + nougat（旧命名已废弃）

> 旧版小写名 `nougat` / `gummy` / `praline` 在 2.0.x **不再被接受**。

**`image-poster-generate --model`**（候选首字母大写，与 image-edit 的命名空间不同）：`Praline_2`(默认) / `GummyV4.5` / `Nougat` / `Gummy` / `PralineV2`。

**`text-to-image --model`** 候选（小写）：`auto` (默认) / `gummy` / `praline_pro`。`gummy` 走 image_gummy_generate；`praline_pro` 走 image_praline_create_v2（注意：praline 不支持 `image_list`）。

---

## Tool Routing (which command to use)

When a user's intent could map to multiple commands, use these disambiguation rules:

### Generate vs Edit vs Poster

- 无原图，从零生成 → `text-to-image`
- 有原图，修改/重绘/扩展 → `image-edit`
- 输出是带文字排版的海报/营销图 → `image-poster-generate`

### Video commands

- 有原图想动起来 → `image-to-video`
- 无原图，纯文本 → `text-to-video`
- 复刻参考视频里的动作 → `video-motion-transfer`
- 多模态混合（音/视频/图任意组合） → `video-multimodal-generate`

### Specialized tools

- 提分辨率/超清 → `image-superres-enhance`
- 暗光修复 → `image-lowlight-enhance`
- 降噪 → `image-denoise-enhance`
- 换脸 → `image-face-swap`
- 换装 → `image-outfit-swap`
- 抠图（透明底/白底） → `image-cutout`
- 拆宫格 → `image-grid-split`
- 比例适配/外扩 → `image-transform`
- 去水印/去文字/去局部物体 → `image-element-remove`
- 替换图中文字 → `image-text-replace`

---

## Prompt Rules

**Pure natural language, no platform-specific syntax.**

| Forbidden | Source |
|-----------|--------|
| `[Color]::3 + [concept]::2` | Midjourney weights |
| `--no [objects]` | Midjourney negative |
| `(keyword:1.5)` | SD weights |
| `<lora:xxx>` | SD LoRA |

**Correct structure:** `[tone/mood] + [scene/concept] + [core visual] + [material/lighting]`

**Express "no X" positively:** `empty street, clean uncluttered composition` (not `--no cars`)

**image-edit prompt 即编辑指令本身:**

- Erase: `"消除画面中的路人"`
- Redraw: `"将桌上的杯子改成花瓶"`
- Extend: `"向右扩展画面"` (+ set ratio)
- Background: `"将背景换成海滩日落"`

---

## Error Handling

```
1. Simplify prompt — remove complex descriptions, keep core subject + style
2. Reduce size — text-to-image: "2k" 是较低档（更小用 WIDTHxHEIGHT）；image-poster-generate: "2K" → "1K"
3. Remove reference image — if image-to-image failed, try pure text-to-image
4. Stop after 2 consecutive failures — report error with code and hint
5. ORDER_REQUIRED → 提示用户充值，展示 action_url
6. CREDENTIALS_MISSING → 提示用户配置 AK/SK (env 或 meitu config set-ak/set-sk)
```

---

## Key Gotchas

1. `face-swap` 参数拼写是 `sence_image_url`（不是 `scene`）
2. `image-to-video` / `text-to-video` / `video-motion-transfer` / `video-multimodal-generate` 是异步命令——CLI 自动轮询等待
3. `image-edit` 的 `--model` 选择对效果影响极大；不确定时让后端 auto
4. `image-poster-generate` 与 `text-to-image` 是两个不同命令——需要文字排版用前者
5. `image-grid-split` 当前对网格间距敏感，生成网格图时 prompt 强调 "thick white borders" 与 "generous white space between cells"，结果不足时加强间距描述重试
6. `--download-dir` 保存的文件名为 task_id（如 `t_mt1a3i...-1.jpg`）。Skill 下载后应 rename 为规范格式 `{date}_{effect-name}.{ext}`
7. `image-outfit-swap` 接受 `--image_url <person>` + 可选 `--clothes_image_url <clothes>`，prompt 为目标穿搭描述（旧名 image-try-on 已废弃）
8. `image-superres-enhance` 仅做超分不修内容；同时要修复模糊/噪声/低光请走对应 `*-enhance` 命令组合（旧名 image-upscale 已废弃）
9. 旧版 `meitu login` 已移除，凭证管理仅支持 env vars 与 `meitu config set-ak / set-sk`
