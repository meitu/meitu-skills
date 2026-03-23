# Meitu Visual Me Capability Reference

## Capability Overview

| Capability | Command | Description |
|------|------|------|
| Image generation | `meitu image-generate` | Text-to-image, stylization, generation with reference images |
| Image editing | `meitu image-edit` | Prompt-based removal, inpainting, canvas expansion, background blending, filters, etc. |
| Super-resolution upscale | `meitu image-upscale` | Automatic super-resolution upscaling |
| Smart cutout | `meitu image-cutout` | Portrait / product / graphic cutout |
| Face swap | `meitu image-face-swap` | Avatar series, avatar replacement |
| Virtual try-on | `meitu image-try-on` | Virtual clothing try-on |
| Image to video | `meitu image-to-video` | 2-12 second short video, async task |
| Motion transfer | `meitu video-motion-transfer` | Video motion transfer, async task |
| Portrait beauty enhance | `meitu image-beauty-enhance` | Single-person portrait enhancement |
| Text to video | `meitu text-to-video` | Text-only video generation, async task |
| Video to GIF | `meitu video-to-gif` | Convert video to GIF |
| Poster generation | `meitu image-poster-generate` | Poster generation with text layout |
| Grid split | `meitu image-grid-split` | Split grid composite images |

> All commands support `--download-dir` to specify a download directory and `--json` for JSON-formatted output.

> **Note:** This skill's 17 workflows use 7 of the 13 capabilities above. The remaining 6 (image-upscale, image-cutout, text-to-video, video-to-gif, image-poster-generate, image-grid-split) are fully supported by meitu-cli and can be called directly — they just don't have pre-built workflow scenarios. Ask the user what they need and refer to the parameter tables below.

---

## Image Generation · `meitu image-generate`

The most commonly used capability, covering text-to-image and stylization scenarios. Supports pure text-to-image as well as generation with reference images.

```bash
# Text-to-image
meitu image-generate --prompt "赛博朋克风格的城市夜景"

# With reference image
meitu image-generate --image "参考图URL" --prompt "将照片转为水彩画风格" --size 2k

# Multiple reference images
meitu image-generate --image "图片URL1" "图片URL2" --prompt "合影风格化"

# Specify ratio and output JSON
meitu image-generate --prompt "微缩场景" --ratio 1:1 --json

# Output JSON and specify download directory
meitu image-generate --prompt "微缩场景" --json --download-dir ./output
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--prompt PROMPT` | Required | Prompt text |
| `--image IMAGE_LIST [IMAGE_LIST ...]` | Optional | Image URL array, supports single and multiple images |
| `--size SIZE` | Optional | Output size: `2k` / `3k` / `WIDTHxHEIGHT` (e.g. `1024x768`), default `2k`. **Note:** format differs from `image-poster-generate` (`1K`/`2K`/`4K`), do not mix |
| `--ratio RATIO` | Optional | Output ratio: `1:1` / `4:3` / `3:4` / `16:9` / `9:16` / `3:2` / `2:3` / `21:9`, default `3:4` |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Image Editing · `meitu image-edit`

Uses prompt-based natural language descriptions to perform various editing operations including removal, inpainting, canvas expansion, background blending, and filters.

```bash
# Remove bystanders
meitu image-edit --image "图片URL" --prompt "消除画面中的路人"

# Inpainting
meitu image-edit --image "图片URL" --prompt "将背景替换为海边日落"

# Canvas expansion (with ratio)
meitu image-edit --image "图片URL" --prompt "扩展画面" --ratio 16:9

# Multi-image editing
meitu image-edit --image "图片URL1" "图片URL2" --prompt "统一色调风格"
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image IMAGE_LIST [IMAGE_LIST ...]` | Required | Image URL array |
| `--prompt PROMPT` | Required | Prompt text describing the edit operation |
| `--model MODEL` | Optional | Sub-model: `nougat` (stylization: cartoon/3D/anime/sketch) / `gummy` (portrait/pet) / `praline` (general editing), default `praline` |
| `--ratio RATIO` | Optional | Output ratio: `auto` / `1:1` / `2:3` / `3:2` / `3:4` / `4:3` / `4:5` / `5:4` / `9:16` / `16:9` / `21:9`, default `auto` |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

**Usage note:** There is no `--mode` parameter. All editing operations (removal, inpainting, expansion, background blending, filters, etc.) are described via the `--prompt` parameter in natural language.

**Model Selection Guide:**

| Priority | Model | When to use | Output style |
|--------|-------|--------|---------|
| 1 | nougat | Stylization: cartoon, 3D figure, anime, sketch, artistic recreation | Artistic (NOT realistic face) |
| 2 | gummy | Portrait/pet photography, hairstyle adjustments | Realistic portrait |
| 3 | praline (default) | Everything else: text manipulation, background swap, color changes, add/remove elements, multi-image fusion, composition analysis | General editing |

> Quick rule: "变画风" (style change, output doesn't look like real person) → nougat; "拍写真/换发型" (portrait photo) → gummy; "改内容" (modify content) → praline

**Ratio constraints by model (server-side enforced):**
- `praline`: auto/1:1/2:3/3:2/3:4/4:3/4:5/5:4/9:16/16:9/21:9
- `nougat`: auto/1:1/2:3/3:2/3:4/4:3 (documented as auto/1:1/2:3/3:2 but 3:4 etc. also work)
- `gummy`: auto/1:1/4:3/3:4/16:9/9:16/3:2/2:3/21:9

---

## Super-Resolution Upscale · `meitu image-upscale`

Automatic super-resolution upscaling; no manual scale factor needed.

```bash
# Auto super-resolution upscale
meitu image-upscale --image "图片URL"

# Output JSON
meitu image-upscale --image "图片URL" --json --download-dir ./output
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image IMAGE_URL` | Required | Image URL |
| `--model_type MODEL_TYPE` | Optional | Super-resolution model type: `0`=portrait, `1`=product, `2`=graphic; auto-detect if omitted |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

**Usage note:** There is no `--scale` parameter. The system automatically determines and performs the upscaling. `--model_type` can optionally specify content type for optimized upscaling.

---

## Smart Cutout · `meitu image-cutout`

Supports portrait cutout, product cutout, and graphic cutout, with automatic type detection.

```bash
# Auto-detect cutout type
meitu image-cutout --image "图片URL"

# Portrait cutout
meitu image-cutout --image "图片URL" --model_type 0

# Product cutout
meitu image-cutout --image "图片URL" --model_type 1 --download-dir ./output
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image IMAGE_URL` | Required | Image URL |
| `--model_type MODEL_TYPE` | Optional | Cutout type: `0`=portrait, `1`=product, `2`=graphic; auto-detect if omitted |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

**Usage note:** Cutout outputs a transparent-background PNG. Background swap **does not require cutout first** — using `image-edit` directly in one step produces better results (see workflow 11).

---

## Face Swap · `meitu image-face-swap`

For avatar series, avatar replacement, and similar scenarios.

```bash
meitu image-face-swap \
  --head_image_url "头部参考图URL" \
  --sence_image_url "场景参考图URL" \
  --prompt "自然融合，保持光影一致"
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--head_image_url HEAD_IMAGE_URL` | Required | Head reference image URL |
| `--sence_image_url SENCE_IMAGE_URL` | Required | Scene reference image URL |
| `--prompt PROMPT` | Required | Prompt text |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Virtual Try-On · `meitu image-try-on`

Virtual clothing try-on, supporting multiple garment replacement zones.

```bash
# Basic usage
meitu image-try-on \
  --clothes_image_url "衣服图片URL" \
  --person_image_url "人物图片URL"

# Specify upper body replacement, no super-resolution
meitu image-try-on \
  --clothes_image_url "衣服图片URL" \
  --person_image_url "人物图片URL" \
  --replace upper \
  --need_sd 0
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--clothes_image_url CLOTHES_IMAGE_URL` | Required | Clothing image URL |
| `--person_image_url PERSON_IMAGE_URL` | Required | Person image URL |
| `--replace REPLACE` | Optional | Replacement zone: `upper` / `lower` / `dress` / `coat` / `jumpsuit` / `full` / `unknown`, default `unknown` |
| `--need_sd NEED_SD` | Optional | Super-resolution needed: `1`=yes, `0`=no, default `1` |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Image to Video · `meitu image-to-video`

Async task; generates a short video from an image and description.

```bash
# Basic usage
meitu image-to-video \
  --image "图片URL" \
  --prompt "人物缓缓转头微笑"

# Specify duration and ratio
meitu image-to-video \
  --image "图片URL1" "图片URL2" \
  --prompt "两个场景切换过渡" \
  --video_duration 8 \
  --ratio 16:9

# Output JSON
meitu image-to-video --image "图片URL" --prompt "花瓣飘落" --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image IMAGE_LIST [IMAGE_LIST ...]` | Required | Image URL array |
| `--prompt PROMPT` | Required | Operation description |
| `--video_duration VIDEO_DURATION` | Optional | Video duration: 2-12 seconds, default `5` |
| `--ratio RATIO` | Optional | Video ratio: `adaptive` / `16:9` / `4:3` / `1:1` / `3:4` / `9:16` / `21:9`, default `adaptive` |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Motion Transfer · `meitu video-motion-transfer`

Async task; transfers motion from a video onto a person in an image.

```bash
meitu video-motion-transfer \
  --image_url "目标人物图片URL" \
  --video_url "动作参考视频URL" \
  --prompt "保持人物外观，迁移舞蹈动作"
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image_url IMAGE_URL` | Required | Image URL (target person) |
| `--video_url VIDEO_URL` | Required | Video URL (motion reference) |
| `--prompt PROMPT` | Required | Prompt text |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Portrait Beauty Enhance · `meitu image-beauty-enhance`

Single-person portrait enhancement: skin smoothing, brightening, facial refinement.

```bash
# Natural beauty
meitu image-beauty-enhance --image "图片URL"

# Heavy beauty
meitu image-beauty-enhance --image "图片URL" --beatify_type 1 --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image IMAGE_URL` | Required | Image URL |
| `--beatify_type BEATIFY_TYPE` | Optional | Enhancement type: `0`=natural, `1`=heavy, default `0` |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

**Usage note:** Single-person photos only.

---

## Text to Video · `meitu text-to-video`

Text-only cinematic video generation with rich camera movements and ambient sound. Async task.

```bash
# Basic usage
meitu text-to-video --prompt "清晨的森林，阳光穿过树叶洒落"

# Specify duration and sound
meitu text-to-video --prompt "赛博朋克城市街道，霓虹灯闪烁" --video_duration 10 --sound on --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--prompt PROMPT` | Required | Video description prompt |
| `--video_duration VIDEO_DURATION` | Optional | Video duration: `5` / `10` seconds, default `5` |
| `--sound SOUND` | Optional | Ambient sound: `on` / `off`, default `off` |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Video to GIF · `meitu video-to-gif`

Convert video to GIF; max long edge 480px.

```bash
# Basic usage (WeChat sticker format)
meitu video-to-gif --image "视频URL"

# Non-WeChat format
meitu video-to-gif --image "视频URL" --wechat_gif false --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image IMAGE_URL` | Required | Video URL |
| `--wechat_gif WECHAT_GIF` | Optional | WeChat sticker format: `true` / `false`, default `true` |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Poster Generation · `meitu image-poster-generate`

Poster generation with text layout, supporting Chinese and English; suitable for promotions and ads.

```bash
# Text-only poster generation
meitu image-poster-generate --prompt "夏日清仓大促，全场五折起"

# With reference image
meitu image-poster-generate --prompt "新品发布会邀请函" --image "参考图URL" --ratio 9:16 --size 2K

# Specify model and output format
meitu image-poster-generate --prompt "咖啡店开业海报" --model Nougat --output_format png --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--prompt PROMPT` | Required | Poster description prompt |
| `--image IMAGE_URL` | Optional | Reference image URL |
| `--model MODEL` | Optional | Model: `Praline_2` / `Gummy` / `Nougat` / `PralineV2` / `GummyV4.5`, default `Praline_2` |
| `--size SIZE` | Optional | Output size: `auto` / `512` / `1K` / `2K` / `4K`, default `auto` |
| `--ratio RATIO` | Optional | Output ratio: `auto` / `1:1` / `1:3` / `3:1` / `2:1` / `1:2` / `3:2` / `2:3` / `4:3` / `3:4` / `4:5` / `5:4` / `9:16` / `16:9`, default `auto` |
| `--output_format OUTPUT_FORMAT` | Optional | Output format: `jpeg` / `png` / `webp`, default `png` |
| `--enhance_prompt` | Optional | Whether to enhance prompt, default `false` |
| `--enhance_template` | Optional | Enhancement template |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Grid Split · `meitu image-grid-split`

Split a grid composite image into individual images; currently supports 2x2 (four-panel grid).

```bash
# Split four-panel grid
meitu image-grid-split --image "网格图URL" --json
```

**Parameter table:**

| Parameter | Required | Description |
|------|---------|------|
| `--image IMAGE_URL` | Required | Grid image URL |
| `--download-dir` | Optional | Download directory |
| `--json` | Optional | JSON-formatted output |

---

## Workflow-to-Capability Mapping

| Workflow | Primary command | Notes |
|----------|---------|------|
| Text-to-image (miniature scene, daily card, morning grid, etc.) | `image-generate --prompt "..."` | Pure text-to-image |
| Stylization | `image-generate --image "reference" --prompt "..."` | With reference image |
| Background swap | `image-edit --image "original" --prompt "Keep the person the same, change background to ..."` | One step, no cutout needed first |
| Avatar series | `image-generate` + `image-face-swap` | Generate base + face swap |
| Multi-platform adaptation | `image-edit --ratio <target ratio> --prompt "..."` | Adapt via different ratios |
| ID card | `image-generate --prompt "..."` | Generate ID-style image |
| Group photo | `image-generate --image "image1" "image2" --prompt "..."` | Multi-reference group photo |
| Virtual try-on | `image-try-on --clothes_image_url "..." --person_image_url "..."` | Specify clothing and person |
| Video production | `image-to-video --image "..." --prompt "..."` | Image to short video |
| Motion transfer | `video-motion-transfer --image_url "..." --video_url "..." --prompt "..."` | Transfer video motion to image person |
| Portrait beauty | `image-beauty-enhance --image "..."` | Single person |
| Text to video | `text-to-video --prompt "..."` | No image input required |
| Video to GIF | `video-to-gif --image "..."` | Video input |
| Poster generation | `image-poster-generate --prompt "..."` | With text layout |
| Grid split | `image-grid-split --image "..."` | Grid image input |

---

## Calling Conventions

1. **Add `--json` to all commands** — ensure parseable output
2. **Check the `ok` field** — `true` means success, `false` check `code` and `hint` fields for error details
3. **Get results correctly** — without `--download-dir`: use `media_urls[0]`; with `--download-dir`: use `downloaded_files[0].saved_path` (local path, more reliable). Note: `saved_path` returns absolute paths; display to user as `~/.openclaw/...` format
4. **Image input supports both local paths and URLs** — CLI handles upload internally
5. **Note the `sence_image_url` spelling** — face-swap parameter is `sence`, not `scene`
6. **image-edit has no mode parameter** — all editing operations are described via prompt
7. **image-upscale has no scale parameter** — upscaling is automatic
8. **Parameter aliases** — many commands accept both `--image` and `--image_list` (or `--image_url`); use `--image` uniformly
9. **Credential verification** — use `meitu auth verify --json` to check credentials without consuming API quota
