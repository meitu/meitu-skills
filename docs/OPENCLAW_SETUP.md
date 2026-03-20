# OPENCLAW_SETUP

## Recommended skills

Load the following paths under `~/.openclaw/skills/`:

- `meitu-ai/SKILL.md` (base tool skill, should always be loaded)
- `meitu-video-motion-transfer/SKILL.md`
- `meitu-image-edit/SKILL.md`
- `meitu-image-generate/SKILL.md`
- `meitu-image-upscale/SKILL.md`
- `meitu-image-virtual-tryon/SKILL.md`
- `meitu-image-to-video/SKILL.md`
- `meitu-image-face-swap/SKILL.md`
- `meitu-image-cutout/SKILL.md`
- `article-to-cover/SKILL.md`

## Trigger pattern

Recommended:
- load `meitu-ai` as base tool skill
- invoke scenario skills directly by name

Example prompts:

```text
Use meitu-image-edit.
Input:
{"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格","size":"2K","output_format":"jpeg","ratio":"auto"}
```

```text
Use meitu-image-upscale.
Input:
{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}
```
