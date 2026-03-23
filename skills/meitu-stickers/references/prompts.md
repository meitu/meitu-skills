---
name: sticker-prompts
description: 四宫格表情包贴纸的风格 prompt 模板和网格约束
---

## GRID_CONSTRAINTS

> 所有风格 prompt MUST 拼接此约束，确保生成结果可被 `image-grid-split` 正确切分。

```
Strict 2x2 grid layout on pure white (#FFFFFF) background. Each sticker must be completely isolated — no shadows, no borders, no frames, no decorative elements between stickers. Leave at least 20% white padding between each sticker and around the entire grid. No sticker element may touch or overlap another sticker's area. Each sticker should be a self-contained character illustration.
```

## chibi

```
Create a 2x2 grid of chibi stickers based on the inserted photo, featuring 4 different expressions and reactions. Oversized head with small body, round cute features, expressive eyes. Keep the character's resemblance to the original photo.
```

## clay

```
Create a 2x2 grid of 3D clay/plasticine style stickers based on the inserted photo, featuring 4 different expressions. Soft rounded shapes, matte clay texture with subtle highlights, as if sculpted from colorful modeling clay. Keep the character's resemblance to the original photo.
```

## pixel

```
Create a 2x2 grid of pixel art style stickers based on the inserted photo, featuring 4 different expressions. Clean pixel edges, limited color palette, retro game aesthetic, each sticker in a crisp pixelated style. Keep the character's recognizable features from the original photo.
```

## emoji

```
Create a 2x2 grid of emoji-style stickers based on the inserted photo, featuring 4 different expressions. Bold black outlines, flat vibrant colors, simplified facial features, rounded circular face shape. Keep the character's recognizable features from the original photo.
```

## custom

```
Create a 2x2 grid of {user_style_description} style stickers based on the inserted photo, featuring 4 different expressions. Keep the character's resemblance to the original photo.
```

**变量：** `{user_style_description}` — 用户自定义风格描述（如"水彩"、"赛博朋克"）。
