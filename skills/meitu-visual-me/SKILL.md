---
name: meitu-visual-me
description: "Memory-driven AI visual assistant. Supports 7 core capabilities (image generation, editing, face swap, virtual try-on, beauty enhance, image-to-video, motion transfer) and 17 scenario workflows. Triggered when user says '帮我画', '换背景', '头像系列', '试穿', '动起来', '微缩场景', '今日卡', '换风格', '美颜', etc. Also applies to any visual content creation need."
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

# Meitu Visual Me

> **Always respond in the user's language.**

> **Data Disclaimer:**
> - **Local reads:** Meitu Visual Me reads local files such as `MEMORY.md`, `USER.md`, and `./visual/PROFILE.md` for personalized generation. This data never leaves your device.
> - **Uploaded to meitu API:** Images you provide (photos, reference images) and generated prompts are sent to the Meitu OpenAPI for processing, subject to the Meitu privacy policy.
> - **First-use authorization:** On first use, the skill will explain the above data usage. You can choose not to provide photos (falling back to text-to-image mode).

## Overview

Memory-driven AI visual assistant. Reads user profiles and daily memories to generate personalized images and videos. Supports 17 scenario workflows and 28 trending styles. Play first, give feedback, and the system automatically learns your preferences.

| You say | What it does |
|------|------|
| "帮我画" (draw something) | Automatically selects a scenario based on your current state and generates |
| Send a selfie + "换个赛博背景" (swap to cyber background) | Swaps the background, instant result |
| "头像系列" (avatar series) | Generates multiple style avatars from one face |
| "帮我做张 ID 卡" (make me an ID card) | Four trendy styles to choose from, exclusive collectible card |
| "微缩场景" (miniature scene) | Turns your current state into a toy miniature world |
| "一键换风格" (one-click style remix) | One image, multiple style variants |
| "今日卡" (daily card) | City + weather + mood, generates a daily info card |
| "帮我试穿这件" (try this on) | Send a clothing image for virtual try-on |
| "把这张图动起来" (bring this image to life) | Turns an image into a short video |
| "合个影" (take a photo together) | A photo with you and OpenClaw together |

## Dependencies

- tools: meitu-cli (`npm install -g meitu-cli`)
- credentials: `meitu config set-ak --value <AK>` + `meitu config set-sk --value <SK>`
- user knowledge (optional): `./visual/` (created on demand; if absent, all knowledge reads are skipped)
- project files: `./` (cwd, containing `openclaw.yaml`, `DESIGN.md`, etc.)
- platform context (optional): `USER.md`, `MEMORY.md`, `memory/今日.md`, `SOUL.md`, `IDENTITY.md` (platform-injected; skip if absent)
- user config (optional): `$VISUAL/config/defaults.yaml`

> **Path alias:** In the text below, `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`. When `./visual/` exists, it points to that directory; on the OpenClaw platform it auto-resolves to `~/.openclaw/workspace/visual/`.

## Platform Setup

**OpenClaw:** User data is located at `~/.openclaw/workspace/visual/`. The platform injects it automatically; `./visual/` resolves to that path at runtime.

**Claude Code / Other Agents:** User data is located at `./visual/` under the current working directory, created automatically on first use.

> All `./visual/` paths in the workflows below are resolved to the corresponding actual path by each platform at runtime.

## Preflight

Must pass before every generation; if it fails, **stop generation**:

1. `meitu --version` — if not installed, prompt: `npm install -g meitu-cli`
2. Verify credentials: `meitu auth verify --json` — if credentials are invalid, this will return an auth error. For credential setup, read [references/setup.md](references/setup.md)
3. Check whether the `./visual/` directory exists (if not, prompt first-time user; do not block)
4. Did the user send an image or a video? — Videos are not supported; prompt user to send a screenshot
5. **One-time workspace resolution** (results persist throughout the workflow):
   Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `./visual/` 目录 → 确定 capabilities

   **Variables available after resolution (referenced directly in subsequent steps):**
   ```
   mode             = "project" (cwd has openclaw.yaml) | "one-off"
   visual           = ./visual/ path (value if exists, otherwise null)
   can_read_knowledge = visual exists
   can_record       = mode == "project" AND visual exists
   output_dir       = Resolve output_dir: openclaw.yaml → "./output/" | else → "$VISUAL/output/meitu-visual-me/"
   ```
   `mkdir -p {output_dir}`
   Hard constraint: output_dir MUST NOT point to inside the skill folder

---

## Core Workflow

```
Preflight → [Context] → Execute → [Refine] → Deliver → [Record]
              ↑ creative tasks run this       ↑ creative     ↑ project mode
              ↑ tool tasks skip               ↑ tool skip    ↑ one-off skip
```

### Context

#### Part 1: Routing

**Route first, read later** — match the workflow first, then decide what to read and how to proceed.

**First: Match Workflow**

Compare the user's input against the trigger words in the Workflows section below to match a specific workflow. Read [references/workflows.md](references/workflows.md) for scenario details.

When no match is found, there are three cases:
- **Clear description** (e.g., "帮我画一只猫在月球上") — no workflow match needed; determine the style per prompt building rules, then generate directly with `image-generate`
- **Only sent an image without text** — recommend 4 suitable options based on image content (e.g., swap background, style remix, make ID card, image-to-video), let user choose
- **Vague instruction** (e.g., "帮我画", "帮我生张图") — recommend scenarios:
  1. Check `./visual/memory/global.md` for preferred scenarios — if found, prioritize those
  2. No memory — pick 4 from the 17 workflows based on time of day and context, let user choose

**Second: Determine Read Level and Style Handling**

| Workflow type | Read level | Style handling | Included workflows |
|-------------|---------|---------|--------------|
| Scenario generation | Standard read | Follow style rules (use memory if available, otherwise offer 4 options) | persona-diorama, daily-card, morning-grid, ootd, data-diorama, emotion-grid, relationship-board, memory-collage, real-toon |
| Guided generation | Standard read | Workflow includes built-in style selection step (e.g., ID card pick 1 of 4) | id-card, style-remix, avatar-series |
| Background swap | Light read | No style selection needed (scene described by user) | swap-bg |
| Tool operation | Zero read | No style involved, execute directly | beauty, virtual-tryon |
| Video | Light read | No style involved | to-video, motion-transfer |

For image generation, read [references/style-library.md](references/style-library.md) for style keywords and auto-matching rules.

**Third: Determine CLI Command**

Each workflow's corresponding CLI command is listed in the Workflows section table. For detailed command parameters, read [references/models.md](references/models.md). `image-edit` requires selecting a sub-model: praline (general editing) / gummy (portrait/pet photography, hairstyle adjustment).

**Routing decision output (passed from Context to Execute):**
```json
{
  "workflow": "persona-diorama",
  "command": "image-generate",
  "read_level": "standard",
  "has_reference_image": true,
  "style": "微缩世界",
  "style_resolved": true
}
```

#### Part 2: Load Context

The read level is determined by the routing table above. Zero-read and light-read workflows do not need this step.

Standard read checklist (highest to lowest priority):

1. `./DESIGN.md` — project context (if present, prioritize it; only supplement what it doesn't cover)
2. `./openclaw.yaml` — resolve short-name references (e.g., `brand: "acme"` → `./visual/assets/brands/acme/`)
3. `./visual/rules/quality.yaml` — forbidden styles
4. `./visual/PROFILE.md` — visual identity
5. `./visual/memory/global.md` (first 30 lines) — preferences
6. Platform context (read if available, skip if not): `USER.md`, `MEMORY.md`, `memory/今日.md`, `SOUL.md`, Weather API

**Use whatever you find; never fabricate user experiences.**

#### Part 3: Build Prompt

Formula: `[composition/camera angle] + [subject] + [action/expression] + [scene/background] + [style reference] + [lighting] + [user-specific details]`

**Hard rules:**

1. **Pure narrative style; keyword stacking is forbidden**
   - ❌ `woman, dress, red background, fashion, 8K, masterpiece`
   - ✅ `A young woman in a tailored brown dress, posing with confidence against a cherry red backdrop, fashion editorial feel with warm film grain`

2. **When a reference image is provided, explicitly state its purpose in the prompt** (preserve facial likeness / reference composition / reference style); don't just attach an image without explanation

3. **Embed style keywords into the narrative** — pick 1-2 and weave them naturally into sentences; stacking at the end is forbidden

4. **When user context is available, prioritize embedding personal details; when unavailable, generate directly based on user description without blocking.**

5. **Every generated image must have a clear style direction.** Style determination priority:
   - User specified a style this time → use it directly
   - User didn't specify, but `./visual/memory/global.md` has a recorded preferred style → use the memorized style directly without asking again
   - User didn't specify, and there's no memory → based on the day's state and scenario, pick 4 suitable styles from [references/style-library.md](references/style-library.md)'s style matching guide, let user choose before generating

   Never generate a "generic" image without a style direction. If the user consistently picks the same style, remember it through the observation pipeline in the Record phase, and use it directly next time.

**Example 1** (persona-diorama — from `memory/今日.md`, the user completed an important delivery today):
> An isometric miniature workspace on a wooden desk. A tiny figure surrounded by [items extracted from memory]. A celebratory confetti cannon mid-burst on the desk corner. Warm afternoon light through a window, the whole scene feels like a lovingly crafted toy shop diorama.

**Example 2** (swap-bg — user sent a selfie and said "换成东京街头"):
> Keep the person exactly the same, change only the background to a vibrant Tokyo street scene with neon signs, busy crosswalks, and the warm glow of shop fronts lining both sides of the road, evening atmosphere with soft city lights

**Example 3** (ID card — with reference image, user chose Cyber Neon style):
> FACE LIKENESS IS THE #1 PRIORITY. Preserve exact facial structure. A young man with short black hair, black-framed glasses, and an oversized hoodie. Apply 3D collectible figure rendering LIGHTLY — keep proportions close to real. Generate a vertical ID CARD in Cyber Neon style: brushed carbon fiber base, neon cyan and magenta glow border, monospaced terminal font. Info area: "小明" / "独立开发者" / "杭州" — EST. 2000. Side strip: "卫衣收集者". Slight tilt, studio-lit product shot feel.

### Execute

**CLI command decision table:**

| Task type | Command | Key parameters | Notes |
|---------|------|---------|------|
| Text-to-image | `meitu image-generate` | `--prompt --size --ratio` | No reference image; `--size` accepts `2k`/`3k`/`WIDTHxHEIGHT` |
| Generation with reference image | `meitu image-generate` | `--image --prompt --size` | Stylization / group photo |
| Background swap / content editing | `meitu image-edit` | `--image --prompt --model` | See model selection table |
| Face swap | `meitu image-face-swap` | `--head_image_url --sence_image_url --prompt` | Avatar series |
| Beauty enhance | `meitu image-beauty-enhance` | `--image --beatify_type` | Single-person photo |
| Image-to-video | `meitu image-to-video` | `--image --prompt --video_duration` | Async task |
| Motion transfer | `meitu video-motion-transfer` | `--image_url --video_url --prompt` | Async task |
| Virtual try-on | `meitu image-try-on` | `--clothes_image_url --person_image_url --replace` | |

**image-edit model selection:**

| Priority | Model | Use case | Output style |
|--------|-------|---------|---------|
| 1 | nougat | Stylization: cartoon, 3D figure, anime, sketch, artistic recreation | Artistic (NOT realistic face) |
| 2 | gummy | Portrait/pet photography, hairstyle adjustment | Realistic portrait |
| 3 | praline (default) | Everything else: text manipulation, background swap, color grading, add/remove elements, multi-image fusion | General editing |

> Quick rule: "变画风" (style change, output doesn't look like real person) → nougat; "拍写真/换发型" (portrait photo) → gummy; "改内容" (modify content) → praline

**Reference image routing:**

| Intent mode | Reference image handling | Command |
|---------|-----------|------|
| Stylization (photo → figurine/anime/etc.) | Pass via --image, prompt describes target style | `image-edit --model nougat` (cartoon/anime/3D) or `image-generate --image` (general style transfer) |
| Background swap | Pass via --image, prompt explicitly says "keep person unchanged" | `image-edit --model praline` |
| Group photo (multiple references) | Pass multiple via --image, prompt describes group photo scene | `image-generate --image img1 img2` |
| Analyze reference only (not passed to tool) | Extract composition/style info into prompt | `image-generate` (pure text-to-image) |
| Face swap | Pass separately via --head_image_url and --sence_image_url | `image-face-swap` |

**Output directory:** Use `output_dir` resolved in Preflight. Ensure the directory exists (`mkdir -p`). Add `--json --download-dir {output_dir}` to all `meitu` commands.

**Result field references:**
- With `--download-dir` → use `downloaded_files[0].saved_path` for local path (`media_urls` also available but local path is more reliable)
- Without `--download-dir` → use `media_urls[0]` for result URL
- Error response → check `code` and `hint` fields (NOT `error_code` / `user_hint`)

**Image input:** Pass user-provided images via URL or local path. When a reference image is needed, check `./visual/assets/references/user.jpg`.

**Command examples:**
```bash
# Text-to-image
meitu image-generate --prompt "..." --size 2k --ratio 1:1 --json --download-dir {output_dir}
# Image editing
meitu image-edit --image <url> --prompt "..." --model praline --json --download-dir {output_dir}
# Image-to-video (async)
meitu image-to-video --image <url> --prompt "..." --video_duration 5 --json
```

**Error degradation (try each level in order):**

| Level | Action | Example |
|------|------|------|
| L1 | Remove low-priority modifiers | Drop lighting/material descriptions, keep subject + scene + style |
| L2 | Downgrade enum parameters | `--size 3k` → `--size 2k` (image-generate); `--size 2K` → `--size 1K` (image-poster-generate); `--ratio 9:16` → `--ratio 1:1` |
| L3 | Remove optional inputs | Drop reference image, switch to pure text-to-image |
| L4 | Minimize to core elements | Keep only subject + style, remove everything else |
| L5 | Stop and report error | Inform user of the specific error, suggest checking credentials or contacting support |

Escalate one level after 2 consecutive failures. For other errors, see [references/troubleshooting.md](references/troubleshooting.md).

### Refine (MUST for creative tasks, skip for tool tasks)

Tool tasks (beauty, virtual-tryon, image-upscale) → skip this step and go directly to Deliver.

Iterative refinement loop for creative tasks:

1. **Present result** — show the generated image + briefly explain design rationale (why this style/composition/color palette)
2. **Wait for feedback** — three possible directions:
   - User approves ("好" / "不错") → proceed to Deliver
   - User requests modifications ("背景换一下" / "颜色太亮") → step 3
   - User rejects entirely ("完全不对" / "重新来") → go back to Execute and regenerate
3. **Adjust and regenerate** — modify prompt or parameters based on feedback → re-run CLI command → back to step 1
4. **Iteration cap** — recommend at most 3 rounds. After 3 rounds, proactively suggest: adjust the requirement direction, split into sub-tasks, or try a different workflow

**Note:** Do not generate multiple images consecutively without presenting results. Wait for user feedback after each generation.

### Deliver

Files are already in the correct directory (Execute uses Preflight's output_dir); only rename is needed:

**File renaming:**
`mv {downloaded} {output_dir}/{YYYY-MM-DD}_{description}.{ext}`

**Path display rule:** When presenting file paths to the user, prefer `~/.openclaw/...` format. Some chat platforms (e.g., WeChat Work MEDIA) only recognize `~/` prefix paths; absolute paths will prevent images/files from displaying. Internal processing can use absolute paths.

**WeChat delivery:** For the WeChat channel (channel=openclaw-weixin), use `MEDIA:visual/output/meitu-visual-me/{filename}.jpg` (relative path).

**After delivery:** After delivery, wait for user feedback before the next generation. If user gives style/preference feedback, proceed to Record. When the user says "适配各平台", read [references/channel-presets.md](references/channel-presets.md).

**DESIGN.md maintenance:** If DESIGN.md Iteration Log > 5 entries → compact: keep the most recent 5, archive older entries to `./drafts/design-history.md`.

### Record

**`can_record` = false → skip this entire section.** In one-off mode, all feedback is only effective for the current conversation.

**Zero-write default** — write nothing after generation; only write when user gives active feedback:

| User says | What to do |
|--------|--------|
| "好" / "喜欢这个风格" | Append observation to `./visual/memory/observations/observations.yaml` (auto, no user confirmation needed). If that observation's `projects` >= 2, mention non-blockingly at end of reply: "By the way, you've preferred X across N projects. Want to save it as a universal preference?" User confirms → write to `memory/global.md` or `memory/scenes/{scene}.md`, delete the observation; user ignores → do nothing |
| "不要 XX 风格" | Has `openclaw.yaml` → ask: "Only skip XX for this project, or never use XX for all future projects?" Project-only → append to `./DESIGN.md` Constraints; all future → append to `./visual/rules/quality.yaml` (requires user confirmation). No `openclaw.yaml` → applies only to current task, no write |
| "我是男的" (identity facts) | Write to `./visual/PROFILE.md` |
| Sends a new reference photo | Save as `./visual/assets/references/user.jpg` |
| "换个背景重生" | Re-run current task, no write |

If the user says nothing, write nothing and don't read observations.yaml (zero overhead).

**One-off mode exception:** When a user repeatedly expresses the same preference in one-off mode (e.g., says "不要渐变" multiple times), the Agent MAY proactively suggest:
> "You've mentioned no gradients several times. Want to add it to the global forbidden list?"
> → User agrees → write to `$VISUAL/rules/quality.yaml` (requires confirmation)
> → User disagrees → effective only for the current conversation

**Positive feedback recording path:**

1. Read `$VISUAL/memory/observations/observations.yaml` (create if it doesn't exist)
2. Scan for semantically similar keys → merge or create new
3. Write back to file
4. If `len(projects) >= 2` → propose promotion (non-blocking)

**Promotion proposal template:**
> "You've preferred X across N projects. Want to save it?
>   → Save to {scope_hint} scene [default]
>   → Save to global preferences
>   → Don't save"

If scope_hint is not null → default to `scenes/{scope_hint}.md`; if null → default to `global.md`.
User confirms → write to target file + delete observation entry. User ignores → do nothing.

For write format details, read [references/feedback-loop.md](references/feedback-loop.md) when handling feedback; for observation lifecycle and classification, read [references/memory-protocol.md](references/memory-protocol.md)

---

## First-Time User Guide

When the `./visual/` directory doesn't exist, this indicates a new user. Read [references/first-time-guide.md](references/first-time-guide.md) to execute the onboarding flow.

---

## Workflows (17)

For all workflow details, read [references/workflows.md](references/workflows.md)

### Generation

| Trigger words | Workflow | Command |
|--------|---------|------|
| 微缩场景 (miniature scene)、个人场景 (personal scene) | persona-diorama | `image-generate` |
| 今日卡 (daily card)、城市打卡 (city check-in) | daily-card | `image-generate` |
| 早安 (good morning)、晨间四宫格 (morning grid) | morning-grid | `image-generate` |
| OOTD、今天穿什么 (what to wear today) | ootd | `image-generate` |
| 数据场景 (data scene)、今日数据 (today's data) | data-diorama | `image-generate` |
| 九宫格 (nine-grid)、情绪九宫格 (emotion grid) | emotion-grid | `image-generate` |
| 关系板 (relationship board)、关系拼贴 (relationship collage) | relationship-board | `image-generate` |
| 记忆拼贴 (memory collage) | memory-collage | `image-generate` |
| 合影 (group photo)、合个影 (take a photo together) | real-toon | `image-generate` |
| ID 卡 (ID card)、收藏卡 (collectible card) | id-card | `image-generate` |
| 一键换风格 (one-click style remix)、换风格 (change style)、风格万花筒 (style kaleidoscope) | style-remix | `image-edit --model nougat` (cartoon/anime/3D) / `image-edit --model praline` (general) / `image-generate` |

### Editing

| Trigger words | Workflow | Command |
|--------|---------|------|
| 换背景 (swap background)、改背景 (change background) | swap-bg | `image-edit --model praline` |
| 头像系列 (avatar series)、换头像 (change avatar) | avatar-series | `image-generate` → `image-face-swap` |
| 美颜 (beauty)、磨皮 (skin smoothing) | beauty | `image-beauty-enhance` |

### Video & Try-on

| Trigger words | Workflow | Command |
|--------|---------|------|
| 动起来 (bring to life)、图生视频 (image to video) | to-video | `image-to-video` |
| 做这个动作 (do this motion) | motion-transfer | `video-motion-transfer` |
| 试穿 (try on)、试衣 (try clothes) | virtual-tryon | `image-try-on` |

---

## References

| File | When to read |
|------|-------|
| [references/workflows.md](references/workflows.md) | When executing a specific scenario workflow |
| [references/models.md](references/models.md) | When detailed command parameters are needed |
| [references/style-library.md](references/style-library.md) | When generating images (user-specified style or auto-matching needed) |
| [references/channel-presets.md](references/channel-presets.md) | When adapting for multiple platforms |
| [references/feedback-loop.md](references/feedback-loop.md) | When handling user feedback write formats |
| [references/memory-protocol.md](references/memory-protocol.md) | When handling observation lifecycle and preference classification |
| [references/troubleshooting.md](references/troubleshooting.md) | When encountering errors |
| [references/setup.md](references/setup.md) | For first-time configuration |
| [references/first-time-guide.md](references/first-time-guide.md) | When `./visual/` doesn't exist (new user onboarding) |
