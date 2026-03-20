# OPENCLAW_SETUP

## Recommended skills

Install/load these skills under `~/.openclaw/skills/`:

- `meitu-tools/SKILL.md`
- `article-to-cover/SKILL.md`

If your environment supports a repository root entry skill, also include:
- `SKILL.md` (root dispatcher)

## Trigger pattern

- Tool execution: use `meitu-tools`
- Poster scenario: use `article-to-cover`

Examples:

```text
/skill meitu-tools
command=image-edit
input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格"}
```

```text
/skill article-to-cover
请把下面内容做成中文海报封面：AI 图像能力平台上线，支持图片编辑、超清、换头像、试衣、图生视频等功能。
```
