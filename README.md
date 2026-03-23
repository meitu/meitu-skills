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
- Tool aggregate skill: `meitu-tools/`
- Primary scene skills: `skills/` (notably `meitu-poster`, `meitu-stickers`, `meitu-visual-me`, `meitu-product-swap`, `meitu-video-dance`)

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

- `MEITU_OPENAPI_ACCESS_KEY` + `MEITU_OPENAPI_SECRET_KEY`, or
- `~/.meitu/credentials.json` (via `meitu config set-ak` / `meitu config set-sk`)
- legacy fallback also supported: `~/.openapi/credentials.json`

4. Smoke test

```bash
node meitu-tools/scripts/run_command.js \
  --command image-upscale \
  --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
```

5. Runtime repair / manual upgrade

- `run_command.js` does not check npm or auto-install `meitu-cli`
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

Memory-driven AI visual assistant. Reads user profiles and daily memories to generate personalized images and videos. Supports 17 scenario workflows (miniature scene, daily card, avatar series, ID card, background swap, virtual try-on, image-to-video, motion transfer, etc.) and 7 core capabilities (image generation, editing, face swap, virtual try-on, beauty enhance, image-to-video, motion transfer).

Triggers: draw something for me, swap background, avatar series, try on, bring to life, miniature scene, daily card, style remix, beauty enhance

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

Automatically diagnoses image quality, portrait, and content issues, then plans and executes an optimal repair pipeline chaining image-upscale / beauty-enhance / image-edit / cutout in the correct order. Users only need to say "fix this image" — no need to know which tool to use.

Triggers: retouch, sharpen, remove watermark, remove bystanders, skin retouching, fix this image, blurry photo, old photo restoration

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

Triggers: beauty enhance, skin smoothing, brighten, retouch, beautify, beauty enhance, make photo look better
