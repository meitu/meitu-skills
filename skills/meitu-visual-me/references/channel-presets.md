# Multi-Platform Parameter Presets

> **Data source:** The authoritative source for platform size specs is `$VISUAL/rules/platforms/`. When that directory exists, read the latest specs from there first. The content below serves as a fallback when `$VISUAL` is unavailable.

When generating, select the corresponding parameters based on the target platform; don't make the user calculate ratios themselves.

---

## Platform Quick Reference

| Platform | Ratio | Recommended size | Use case | Notes |
|------|------|---------|------|---------|
| Xiaohongshu cover | 3:4 | 1080x1440 | Cover image, determines click-through rate | Avoid text in the bottom 20% (title overlay) |
| Xiaohongshu body | 9:16 | 1080x1920 | Multi-image body, unified ratio | Portrait orientation preferred |
| WeChat avatar | 1:1 | 800x800 | Circular crop | Center the subject, leave margin at edges |
| WeChat Moments | 1:1 | 1080x1080 | Nine-grid / single image | 1:1 is safest |
| Instagram Feed | 4:5 | 1080x1350 | Best ratio for Feed real estate | Avoid 1:1; 4:5 gets better visibility |
| Instagram Story | 9:16 | 1080x1920 | Full-screen story | Leave 15% safe zone at top and bottom |
| Weibo / X | 16:9 | 1920x1080 | Landscape attachment | Timeline default crops to 16:9 |
| Douyin / TikTok cover | 9:16 | 1080x1920 | Portrait cover | Bottom 15% obscured by UI |
| Notion cover | 16:9 | 1920x1080 | Page header image | Top and bottom will be cropped; center subject |
| Wallpaper (mobile) | 9:16 | 1170x2532 | Lock screen / home screen | Avoid key content in clock area |
| Wallpaper (desktop) | 16:9 | 2560x1440 | Desktop wallpaper | Avoid content in bottom-right corner (icon overlap) |

---

## Ratio Parameters

Pass ratio values directly via the meitu CLI `--ratio` parameter:

`auto` `1:1` `9:16` `16:9` `3:4` `4:3` `4:5` `5:4` `2:3` `3:2` `21:9`

---

## One-Click Adaptation Default Set

When user says "一键适配" or "适配各平台", output the following 4 images by default:

| # | Platform | Ratio |
|------|------|------|
| 1 | Xiaohongshu cover | 3:4 |
| 2 | Instagram Feed | 4:5 |
| 3 | WeChat Moments | 1:1 |
| 4 | Weibo / X | 16:9 |

Users can specify a custom platform combination, e.g., "帮我出小红书和抖音的".

---

## Platform Style Recommendations

| Platform | Style tendency | Text handling |
|------|---------|---------|
| Xiaohongshu | High saturation, polished, design-forward | Large title text, Chinese preferred |
| Instagram | Unified color tone, magazine feel | English / minimal |
| WeChat Moments | Natural, lifestyle-oriented | Minimal or no text |
| Weibo / X | High info density, eye-catching | Can add text captions |
| Douyin | Portrait impact, sense of motion | Large text, centered |
