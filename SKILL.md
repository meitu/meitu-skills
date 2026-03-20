---
name: meitu-skills
description: Meitu 能力总入口。根据用户意图选择使用 article-to-cover 场景能力或 meitu-tools 通用工具能力。触发词：Meitu 能力、图片编辑、图片生成、图片超清、抠图、换头像、试衣、图生视频、动作迁移、文章转海报。
---

# meitu-skills (Root Entry)

## Purpose

作为总入口 Skill：
- 当用户是“海报方案/文章转封面/设计简报”类需求，优先使用 `article-to-cover`。
- 当用户是“直接图像工具调用”类需求，使用 `meitu-tools`。

## Selection rules

1. Use `article-to-cover` when:
- 用户提供文章、长文本、设计 brief。
- 用户要求输出海报方案、视觉方向、封面图。
- 用户强调参考图洗稿/模仿重构。

2. Use `meitu-tools` when:
- 用户要直接执行工具能力（编辑、生成、超清、抠图、换头像、试衣、图生视频、动作迁移）。
- 用户输入已经是明确参数或接近命令式调用。

## Tool capability map

- 动作迁移 -> `video-motion-transfer`
- 图片编辑 -> `image-edit`
- 图片生成 -> `image-generate`
- 图片超清 -> `image-upscale`
- 试衣 -> `image-virtual-tryon`
- 图生视频 -> `image-to-video`
- 换头像 -> `image-face-swap`
- 抠图 -> `image-cutout`

## Fallback

当意图不明确时：
- 先用一句话确认用户目标是“海报场景”还是“直接工具执行”。
- 若用户未响应，默认使用 `meitu-tools` 并给出最小输入要求。
