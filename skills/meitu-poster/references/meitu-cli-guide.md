# Meitu CLI Reference (aligned with meitu-cli >= 2.0.6)

meitu-cli 命令摘要。完整 API 详见已安装的 `meitu-cli` 文档（`meitu --help` / `meitu <command> --help`）。

---

## Execution Pattern

All commands通过 `meitu` CLI 直接调用，加 `--json` 获取结构化输出：

```bash
meitu <command> [options] --json --download-dir ./output/
```

- `--json` → 输出 JSON（含 URL、task_id 等）
- `--download-dir` → 自动下载生成结果到指定目录
- 异步命令（`image-to-video`、`text-to-video`、`video-motion-transfer`）CLI 自动轮询等待

**Install:** `npm install -g meitu-cli@latest`，然后配置凭证：
- 环境变量（推荐）：`MEITU_OPENAPI_ACCESS_KEY` + `MEITU_OPENAPI_SECRET_KEY`
- 或本地配置：`meitu config set-ak <ACCESS_KEY>` + `meitu config set-sk <SECRET_KEY>`（写入 `~/.meitu/credentials.json`）

---

## Install (when manual setup needed)

```bash
npm install -g meitu-cli@latest
meitu --version
```

Credentials (pick one):
- Env vars (CI/agent 推荐): `export MEITU_OPENAPI_ACCESS_KEY="..."` + `export MEITU_OPENAPI_SECRET_KEY="..."`
- Local config: `meitu config set-ak "<ACCESS_KEY>"` + `meitu config set-sk "<SECRET_KEY>"`
- Config file: `~/.meitu/credentials.json` (`{"accessKey":"...","secretKey":"..."}`)

---

## Capability Catalog

### Image Generation

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `text-to-image` | 纯文本生图，可选参考图 | `prompt` | `image_list`, `size`, `ratio`, `model` |
| `image-poster-generate` | Poster with text layout (Chinese/non-Chinese) | `prompt` | `image_list`, `model`, `size`, `ratio`, `output_format`, `enhance_prompt`, `enhance_template` |

### Image Editing

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-edit` | 通用图生图编辑（电商/人像/多图融合/换背景/加文字 等） | `image_list`, `prompt` | `model`, `ratio`, `size`, `output_format` |
| `image-face-swap` | Face replacement | `head_image_url`, `sence_image_url`, `prompt` | — |
| `image-outfit-swap` | 换装（旧名 image-try-on） | `image_url`, `prompt` | `clothes_image_url` |
| `image-style-transfer` | 风格化（动漫/油画/水彩/3D/像素 等） | `image_url`, `prompt` | — |
| `image-cutout` | Background removal | `image_url`, `prompt` | — |
| `image-grid-split` | Split grid image (2x2) | `image_url` | — |
| `image-superres-enhance` | Super-resolution（旧名 image-upscale） | `image_url`, `prompt` | — |

### Video

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-to-video` | Image → video (async, supports lip-sync) | `image_list`, `prompt` | `video_duration`, `aspect_ratio`, `resolution`, `sound` |
| `text-to-video` | Text → video (async, cinematic) | `prompt` | `video_duration`, `sound` |
| `video-motion-transfer` | Motion transfer (async) | `image_list`, `reference_video_list`, `prompt` | `video_duration`, `aspect_ratio` |
| `video-to-gif` | Video → GIF | `video_url`, `prompt` | — |

---

## Critical: image-edit Model Selection

`image-edit` has three sub-models via the `model` parameter. **Choose by priority (first match wins):**

| Priority | Model | When to use | Output style |
|----------|-------|------------|-------------|
| 1 | `nougat` | Explicit high-quality stylized editing path | Artistic (NOT realistic face) |
| 2 | `gummy_pro` | Portrait/pet photo generation, hairstyle adjustment | Realistic person/pet |
| 3 | `praline_pro` (default) | Everything else: text ops, background swap, color change, element add/remove, multi-image fusion, composition, analysis | General editing |

**Decision guide:**
- "变画风" (change art style, output doesn't look like real person) → prefer `image-style-transfer`; if you must stay on `image-edit`, use `nougat`
- "拍写真/换发型" (portrait photo, output looks like real person) → `gummy_pro`
- "改内容" (modify content, general editing) → `praline_pro`

**Ratio constraints by model:**
- `praline_pro`: auto/1:1/2:3/3:2/3:4/4:3/4:5/5:4/9:16/16:9/21:9
- `nougat`: auto/1:1/2:3/3:2 (3:4 and 4:3 also work in practice)
- `gummy_pro`: auto/1:1/4:3/3:4/16:9/9:16/3:2/2:3/21:9

---

## image-poster-generate Model Selection

`image-poster-generate` also supports model selection. **Choose by priority:**

| Priority | Model | When to use | Output style |
|----------|-------|------------|-------------|
| 1 | `Nougat` | Stylized poster: cartoon, 3D figure, anime, illustration style | Artistic poster |
| 2 | `GummyV4.5` | Portrait-heavy poster, person as main visual | Realistic person poster |
| 3 | `Praline_2` (default) | General commercial poster, product + text layout | Standard poster |

Most poster tasks use `Praline_2` (default). Only override when:
- Output must look hand-drawn/3D cartoon → `Nougat`
- Output features a real person as main visual → `GummyV4.5`

---

## Tool Routing (which command to use)

When a user's intent could map to multiple commands, use these disambiguation rules:

### Generate vs Edit vs Poster
- No source image, creating from scratch → `text-to-image`
- Has source image, modifying it → `image-edit`
- Output is a poster/promotional material with text layout → `image-poster-generate`

### Video commands
- Has source image + want video → `image-to-video`
- No source image, pure text description → `text-to-video`
- Need to replicate specific motion from reference video → `video-motion-transfer`

### Specialized tools
- Only need resolution/clarity boost → `image-superres-enhance`
- Only need face beauty (single person) → `image-edit --model gummy_pro`
- Swap face A onto body B → `image-face-swap`
- Try clothing on person → `image-outfit-swap`
- Remove background → `image-cutout`
- Split grid collage → `image-grid-split`

---

## Non-Existent Parameters (NEVER use)

| Command | Does NOT have | Common mistake |
|---------|--------------|---------------|
| `text-to-image` | `--width`, `--height` | No separate width/height flags — use `size: "2k"/"3k"/WIDTHxHEIGHT` (lowercase) |
| `image-superres-enhance` | `--scale` | No scale factor — auto upscale |
| `image-edit` | `--mode` | No mode param — use `model` for sub-model selection, `prompt` for edit instructions |

`text-to-image` size accepts: `"2k"`, `"3k"`, or `WIDTHxHEIGHT` (lowercase). `image-poster-generate` size accepts: `"auto"`, `"512"`, `"1K"`, `"2K"`, `"4K"` (uppercase). Do not use separate `--width` / `--height` flags.

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

**image-edit prompt is the edit instruction itself:**
- Erase: `"消除画面中的路人"`
- Redraw: `"将桌上的杯子改成花瓶"`
- Extend: `"向右扩展画面"` (+ set ratio)
- Background: `"将背景换成海滩日落"`

---

## Error Handling

```
1. Simplify prompt — remove complex descriptions, keep core subject + style
2. Reduce size — text-to-image: "2k" is the common fallback size (or use WIDTHxHEIGHT for smaller); image-poster-generate: "2K" → "1K"
3. Remove reference image — if image-to-image failed, try pure text-to-image
4. Stop after 2 consecutive failures — report error with code and hint
5. ORDER_REQUIRED → tell user to recharge, provide action_url
6. CREDENTIALS_MISSING → ask user to provide env vars or a valid `~/.meitu/credentials.json`; only use local config commands when they explicitly want persistent local setup
```

---

## Key Gotchas

1. `face-swap` parameter spelling is `sence_image_url` (not `scene`)
2. `image-to-video`, `text-to-video`, `video-motion-transfer` are async — CLI 自动轮询等待
3. `image-edit` 的推荐模型是 `auto` / `gummy_pro` / `praline_pro` / `praline_lite` / `mint_edit`，风格化改走 `image-style-transfer`
4. `image-poster-generate` is separate from `text-to-image` — use it when output needs text layout
5. Portrait beauty is now `image-edit --model gummy_pro`
6. `image-grid-split` currently only supports 2x2 grids
7. `image-outfit-swap` uses `--image_url <person>` + optional `--clothes_image_url <clothes>` + `--prompt`
8. `image-superres-enhance` requires `--prompt`; it no longer accepts `--model_type`
9. `video-to-gif` uses `--video_url` + required `--prompt`; `--wechat_gif` has been removed

