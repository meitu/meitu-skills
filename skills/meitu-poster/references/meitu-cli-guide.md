# Meitu CLI Reference

meitu-cli 命令摘要。完整 API 详见已安装的 `meitu-cli` 文档（`meitu --help`）。

---

## Execution Pattern

All commands通过 `meitu` CLI 直接调用，加 `--json` 获取结构化输出：

```bash
meitu <command> [options] --json --download-dir ./output/
```

- `--json` → 输出 JSON（含 URL、task_id 等）
- `--download-dir` → 自动下载生成结果到指定目录
- 异步命令（`image-to-video`、`text-to-video`、`video-motion-transfer`）CLI 自动轮询等待

**Install:** `npm install -g meitu-cli`（包名 meitu-cli，非 meitu-ai），然后配置凭证：
- 交互式登录：`meitu login`（推荐，自动写入配置文件）
- 环境变量：`OPENAPI_ACCESS_KEY` + `OPENAPI_SECRET_KEY`
- 或配置文件：`~/.meitu/credentials.json`

---

## Install (when manual setup needed)

```bash
npm install -g meitu-cli
meitu --version
```

Credentials (pick one):
- Interactive login: `meitu login`（推荐，自动写入 `~/.meitu/credentials.json`）
- Env vars: `export OPENAPI_ACCESS_KEY="..."` + `export OPENAPI_SECRET_KEY="..."`
- Config file: `~/.meitu/credentials.json` (`{"accessKey":"...","secretKey":"..."}`)

---

## Capability Catalog

### Image Generation

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-generate` | Text-to-image, image-to-image, style transfer | `prompt` | `image`, `size`, `ratio` |
| `image-poster-generate` | Poster with text layout (Chinese/non-Chinese) | `prompt` | `image_list`, `model`, `size`, `ratio`, `output_format`, `enhance_prompt`, `enhance_template` |

### Image Editing

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-edit` | Erase/redraw/extend/background/style/text/analysis | `image`, `prompt` | `model`, `ratio` |
| `image-upscale` | Super-resolution | `image` | `model_type` |
| `image-beauty-enhance` | Face beauty (single person only) | `image` | `beatify_type` |
| `image-face-swap` | Face replacement | `head_image_url`, `sence_image_url`, `prompt` | — |
| `image-try-on` | Virtual try-on | `clothes_image_url`, `person_image_url` | `replace`, `need_sd` |
| `image-cutout` | Background removal | `image` | `model_type` |
| `image-grid-split` | Split grid image (2x2) | `image` | — |

### Video

| Command | Purpose | Required | Optional |
|---------|---------|----------|----------|
| `image-to-video` | Image → video (async, supports lip-sync) | `image`, `prompt` | `video_duration`, `ratio` |
| `text-to-video` | Text → video (async, cinematic) | `prompt` | `video_duration`, `sound` |
| `video-motion-transfer` | Motion transfer (async) | `image_url`, `video_url`, `prompt` | — |
| `video-to-gif` | Video → GIF | `image` | `video_url`, `wechat_gif` |

---

## Critical: image-edit Model Selection

`image-edit` has three sub-models via the `model` parameter. **Choose by priority (first match wins):**

| Priority | Model | When to use | Output style |
|----------|-------|------------|-------------|
| 1 | `nougat` | Stylization: cartoon, 3D figure, anime, sketch, artistic recreation | Artistic (NOT realistic face) |
| 2 | `gummy` | Portrait/pet photo generation, hairstyle adjustment | Realistic person/pet |
| 3 | `praline` (default) | Everything else: text ops, background swap, color change, element add/remove, multi-image fusion, composition, analysis | General editing |

**Decision guide:**
- "变画风" (change art style, output doesn't look like real person) → `nougat`
- "拍写真/换发型" (portrait photo, output looks like real person) → `gummy`
- "改内容" (modify content, general editing) → `praline`

**Ratio constraints by model:**
- `praline`: auto/1:1/2:3/3:2/3:4/4:3/4:5/5:4/9:16/16:9/21:9
- `nougat`: auto/1:1/2:3/3:2 (3:4 and 4:3 also work in practice)
- `gummy`: auto/1:1/4:3/3:4/16:9/9:16/3:2/2:3/21:9

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
- No source image, creating from scratch → `image-generate`
- Has source image, modifying it → `image-edit`
- Output is a poster/promotional material with text layout → `image-poster-generate`

### Video commands
- Has source image + want video → `image-to-video`
- No source image, pure text description → `text-to-video`
- Need to replicate specific motion from reference video → `video-motion-transfer`

### Specialized tools
- Only need resolution/clarity boost → `image-upscale`
- Only need face beauty (single person) → `image-beauty-enhance`
- Swap face A onto body B → `image-face-swap`
- Try clothing on person → `image-try-on`
- Remove background → `image-cutout`
- Split grid collage → `image-grid-split`

---

## Non-Existent Parameters (NEVER use)

| Command | Does NOT have | Common mistake |
|---------|--------------|---------------|
| `image-generate` | `--model` | No model selection — backend decides |
| `image-generate` | `--width`, `--height` | No pixel dimensions — use `size: "2k"/"3k"/WIDTHxHEIGHT` (lowercase) |
| `image-upscale` | `--scale` | No scale factor — auto upscale |
| `image-edit` | `--mode` | No mode param — use `model` for sub-model selection, `prompt` for edit instructions |

`image-generate` size accepts: `"2k"`, `"3k"`, or `WIDTHxHEIGHT` (lowercase). `image-poster-generate` size accepts: `"auto"`, `"512"`, `"1K"`, `"2K"`, `"4K"` (uppercase). Never use pixel values for either.

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
2. Reduce size — image-generate: "2k" is lowest enum (use WIDTHxHEIGHT for smaller); image-poster-generate: "2K" → "1K"
3. Remove reference image — if image-to-image failed, try pure text-to-image
4. Stop after 2 consecutive failures — report error with code and hint
5. ORDER_REQUIRED → tell user to recharge, provide action_url
6. CREDENTIALS_MISSING → ask user to configure AK/SK
```

---

## Key Gotchas

1. `face-swap` parameter spelling is `sence_image_url` (not `scene`)
2. `image-to-video`, `text-to-video`, `video-motion-transfer` are async — CLI 自动轮询等待
3. `image-edit` model selection (`nougat`/`gummy`/`praline`) is critical — wrong model = wrong output style
4. `image-poster-generate` is separate from `image-generate` — use it when output needs text layout
5. `image-beauty-enhance` only works on single-person images
6. `image-grid-split` currently only supports 2x2 grids
7. `image-try-on` `replace` values: upper/lower/dress/coat/jumpsuit/full/unknown
8. `--download-dir` 保存的文件名为 task_id（如 `t_mt1a3i...-1.jpg`）。Skill 下载后应 rename 为规范格式 `{date}_{effect-name}.{ext}`
9. `image-grid-split` 对网格间距敏感。生成网格图时，prompt 中应强调 "thick white borders" 和 "generous white space between cells"。如果返回数量不足，用更强的间距描述重新生成后重试
