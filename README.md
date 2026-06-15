# meitu-skills

Agent skill library for Meitu OpenAPI — enables AI agents (Claude Code, Cursor, OpenClaw, etc.) to generate posters, stickers, videos, and product images through purpose-built, scene-specific workflows.

## Security

**Important:** This skill requires API credentials. The runner does not auto-upgrade the CLI; runtime repair is manual.

See [SECURITY.md](SECURITY.md) for:
- Credential handling details
- Permission requirements
- Manual runtime repair guidance
- Security audit checklist

## Layout

- Root entry skill: `SKILL.md` (global routing guidance)
- Tool aggregate skill: `meitu-tools/` — command catalog in `meitu-tools/references/tools.yaml`
- Scene skills and atomic command skills: `skills/`
  - Scene skills (e.g. `meitu-poster`, `meitu-stickers`, `meitu-visual-me`, `meitu-product-swap`, `meitu-video-dance`, `meitu-game-2d-assets`)
  - Atomic command skills mapped 1:1 to CLI commands (e.g. `image-cutout`, `image-edit`, `image-poster-generate`, `image-to-video`, `video-motion-transfer`, `text-to-image`, `text-to-video`, etc.)

## Quick Start

1. Install all skills

Preferred (ClawHub):

```bash
npm install -g clawhub
clawhub install meitu-skills
```

Fallback (GitHub URL):

```bash
npx -y skills add https://github.com/meitu/meitu-skills --yes
```

2. Install runtime CLI

```bash
npm install -g meitu-cli@latest
```

3. Configure credentials

- `MEITU_OPENAPI_ACCESS_KEY` + `MEITU_OPENAPI_SECRET_KEY` (env), or
- `~/.meitu/credentials.json` (pre-provisioned or created by explicit local setup), or
- manual local setup when you intentionally want credentials written to disk: `meitu config set-ak` / `meitu config set-sk`

4. Smoke test

```bash
meitu --version
meitu image-cutout --image_url https://example.com/sample.jpg --prompt "person" --json
```

5. Runtime repair / manual upgrade

- Skills do not check npm or auto-install `meitu-cli`
- If runtime is missing/outdated, follow the manual repair commands below
- Long `action_url` values are preserved as-is; chat UIs may visually truncate them, but clicking still uses the full URL

Manual repair / upgrade:

```bash
npm install -g meitu-cli@latest
meitu --version
```

6. Sensitive data self-check (before commit/push/package)

```bash
rg -n --hidden -S \
  -g '!.git' -g '!node_modules' \
  '(MEITU_OPENAPI_ACCESS_KEY|MEITU_OPENAPI_SECRET_KEY|accessKey|secretKey|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,}|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)' .
```

- Run this before `git commit`, `git push`, and any zip/tar delivery.
- No output means no obvious plaintext secret was found by this rule set.

## Skills

### meitu-poster

Art-director-level poster design. Generate poster images from a single sentence — cover images, marketing graphics, infographics, event posters and more. Automatically identifies industry style and adapts to platform dimensions (Xiaohongshu, WeChat, Douyin, etc.). With a reference image, performs style washing or mimicry reconstruction; without one, plans creative direction from scratch.

Triggers: poster design, make a poster, cover image, design brief, article-to-poster

---

### meitu-stickers

Generates a multi-style 2×2 sticker grid from a user-uploaded photo, then splits it into 4 individual stickers. Optionally converts selected stickers or the full set into animated GIFs. Built-in styles: chibi (Q版), 3D clay, pixel art, and emoji; custom styles are also supported.

Triggers: sticker pack, sticker, emoji pack, make stickers, chibi stickers

---

### meitu-visual-me

Memory-driven AI visual assistant for explicit personalized visual workflows. Reads user profiles and daily memories only when the workflow needs them, supports 17 scenario workflows (miniature scene, daily card, avatar series, ID card, background swap, virtual try-on, image-to-video, motion transfer, etc.), and may send selected local context to Meitu OpenAPI.

Triggers: avatar series, selfie background swap, try on this outfit, style remix, daily card, make this image move

---

### meitu-product-swap

Intelligently replaces products in e-commerce images to produce high-quality product-composite results. Supports one-to-one, one-to-many, and many-to-one mapping — seamlessly placing a product into the scene of a target reference image.

Triggers: product swap, replace product, replicate viral listing image, replace product subject

---

### meitu-video-dance

Extracts motion trajectories from a reference video and transfers them onto a target character image, generating a video of that character performing the same movements. Uses `meitu video-motion-transfer` (async task).

Triggers: motion transfer, dance video, make photo dance, bring character to life, dance transfer, video motion replication

---

### meitu-upscale

One-click image super-resolution: increases resolution, sharpens clarity, and removes noise and compression artifacts. Supports portrait, product, and graphic modes with automatic or manual model selection. Does not alter image content — only makes it sharper.

Triggers: super clear, sharpen, HD, increase resolution, blurry image, enlarge image, upscale, super resolution

---

### meitu-product-view

Generates multi-angle product shots from a single product image. Supports standard three-view, e-commerce five-view, and full-angle presets. Offers white background, scene, and transparent background modes with optional upscaling. Compatible with Taobao, JD, Pinduoduo, Amazon, and other major e-commerce platform specs.

Triggers: product three-view, multi-angle product shots, product display images, product multi-angle, three-view

---

### meitu-image-fix

Automatically diagnoses multi-issue problems on a single existing image, then plans and executes a composite repair pipeline chaining `image-superres-enhance`, `image-edit`, and `image-cutout` in the correct order. Use it when the user wants end-to-end repair or has multiple issues in the same image, not for one clearly scoped single-effect request.

Triggers: composite image repair, fix blur plus watermark, repair this old photo with multiple issues, one-click repair this picture

---

### meitu-id-photo

Takes a portrait photo and runs a two-step pipeline — natural beauty enhancement → AI redraw (formal attire + solid background + spec-compliant crop) — to produce a standard ID photo. Supports 1-inch, 2-inch, passport, visa, and other specs, with white, blue, or red backgrounds.

Triggers: ID photo, 1-inch photo, 2-inch photo, white background photo, blue background photo, passport photo, visa photo

---

### meitu-cutout

Calls `meitu image-cutout` to separate the foreground subject from an image and output a transparent-background PNG. Supports portrait, product, and graphic modes with auto-detection. Also supports batch processing of multiple images.

Triggers: cutout, remove background, transparent background, background removal, remove background, extract subject

---

### meitu-carousel

Generates a cohesive carousel set — a cover poster plus multiple inner pages — with a unified visual style. Suited for Xiaohongshu multi-image posts, knowledge card carousels, and product introduction sets. Supports auto-generated copy or user-provided copy.

Triggers: carousel set, multi-image post, carousel, knowledge card set, product image set

---

### meitu-beauty

One-click AI beauty enhancement: skin smoothing, brightening, and facial feature refinement. Supports natural and enhanced intensity levels. Single-person portrait photos only.

Triggers: portrait beauty enhancement, skin smoothing, natural beauty retouch, strong beauty on single portrait, facial feature refinement

---

### meitu-image-adapt

Intelligently adapts an image to a target aspect ratio or platform spec while preserving the subject and naturally extending the background. Supports portrait → landscape conversion, outpainting, and platform-aware reshaping (Xiaohongshu, Douyin, WeChat, etc.).

Triggers: image adapt, outpaint, expand image, ratio change, portrait to landscape, adapt for Xiaohongshu, adapt for Douyin

---

### meitu-game-2d-assets

Generates 2D game-ready asset packs from a brief or reference image, covering character concepts, props, icons, environment pieces, and style-consistent variants for mobile and casual game production.

Triggers: 2D game assets, game props, game icons, character concepts, asset pack, 游戏素材, 游戏美术

---
