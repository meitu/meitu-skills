# CLI Runtime Upgrade Guide

## Background

`tools-ssot/tools.yaml` 已完成全部 13 个工具的 CLI 字段配置。当前 `meitu-ai` CLI v0.1.4 仅支持其中 9 个命令。本文档记录升级所需的变更和验证步骤。

## Tool ↔ Backend API Mapping

以下映射来源于 `preinternal-aigc.meitu.com` MCP 工具配置 API：

| tool id (tools.yaml) | backend API name | CLI command | CLI 状态 |
|----------------------|-----------------|-------------|---------|
| `video-motion-transfer` | — | `video-motion-transfer` | v0.1.4 已有 |
| `image-to-video` | — | `image-to-video` | v0.1.4 已有 |
| `image-generate` | `image_gummy_create_v50` | `image-generate` | v0.1.4 已有，需加 `--ratio` |
| `image-edit` | — | `image-edit` | v0.1.4 已有，需加 `--model` |
| `image-upscale` | — | `image-upscale` | v0.1.4 已有 |
| `image-beauty-enhance` | — | `image-beauty-enhance` | v0.1.4 已有 |
| `image-face-swap` | — | `image-face-swap` | v0.1.4 已有 |
| `image-virtual-tryon` | — | `image-virtual-tryon` | v0.1.4 已有 |
| `image-cutout` | — | `image-cutout` | v0.1.4 已有 |
| `text-to-video` | `video_bonbon_txt2vid_v26` | `text-to-video` | **需新增** |
| `video-to-gif` | `api_video_to_gif` | `video-to-gif` | **需新增** |
| `image-poster-generate` | `image_poster_generate` | `image-poster-generate` | **需新增** |
| `image-grid-split` | `api_quad_split` | `image-grid-split` | **需新增** |

## New Commands — Parameter Spec

### text-to-video

来源: `video_bonbon_txt2vid_v26`

| 参数 | 类型 | 必填 | 默认值 | 取值 | 说明 |
|------|------|------|--------|------|------|
| `prompt` | string | yes | — | — | 提示词 |
| `video_duration` | number | no | 5 | 5, 10 | 视频时长（秒） |
| `sound` | string | no | off | on, off | 是否同时生成声音 |

### video-to-gif

来源: `api_video_to_gif` / `api_convert_video_to_gif`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `video_url` | string | yes | — | 视频地址 |
| `wechat_gif` | boolean | no | true | 是否转为微信表情包格式 |

### image-poster-generate

来源: `image_poster_generate`

| 参数 | 类型 | 必填 | 默认值 | 取值 | 说明 |
|------|------|------|--------|------|------|
| `prompt` | string | yes | — | — | 海报描述 |
| `image_list` | array | no | — | — | 素材图片地址数组（最多 3 张） |
| `model` | string | no | Praline_2 | Gummy, Nougat, PralineV2, GummyV4.5, Praline_2 | 模型 |
| `size` | string | no | auto | auto, 1K, 2K, 4K, 512 | 分辨率 |
| `ratio` | string | no | auto | auto, 1:1, 1:3, 3:1, 2:1, 1:2, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 9:16, 16:9, 10:16, 16:10, 21:9 | 宽高比 |
| `output_format` | string | no | png | jpeg, png, webp | 输出格式 |
| `enhance_prompt` | boolean | no | false | — | 是否优化提示词 |
| `enhance_template` | string | no | — | — | 优化提示词模板 |

### image-grid-split

来源: `api_quad_split`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image_url` | string | yes | 宫格拼接图地址 |

## Updated Parameters for Existing Commands

### image-edit — 新增 `--model`

| 参数 | 类型 | 必填 | 默认值 | 取值 |
|------|------|------|--------|------|
| `model` | string | no | praline | praline, nougat, gummy |

各模型支持的 `ratio` 取值：

| model | 支持的 ratio |
|-------|-------------|
| praline | auto, 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |
| nougat | auto, 1:1, 2:3, 3:2 |
| gummy | auto, 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9 |

### image-generate — 新增 `--ratio`

| 参数 | 类型 | 必填 | 默认值 | 取值 |
|------|------|------|--------|------|
| `ratio` | string | no | 3:4 | 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9 |

## Batch Test Results (v0.1.4)

测试时间: 2026-03-20

```
PASS: image-upscale, image-cutout, image-edit (praline), image-face-swap, image-virtual-tryon, image-to-video
FAIL (server error):    image-beauty-enhance (test image not portrait), video-motion-transfer (invalid test video)
FAIL (CLI not support): image-generate --ratio, image-edit --model, text-to-video, video-to-gif, image-poster-generate, image-grid-split
```

## Upgrade Verification Checklist

CLI 新版本发布后执行：

```bash
# 1. Update CLI
npm install -g meitu-ai@latest
meitu --version

# 2. Regenerate (should be no-op if tools.yaml hasn't changed)
npm run generate

# 3. Test new commands
node meitu-tools/scripts/run_command.js --command text-to-video \
  --input-json '{"prompt":"A cat walking through snow, cinematic"}'

node meitu-tools/scripts/run_command.js --command video-to-gif \
  --input-json '{"video_url":"<valid_video_url>"}'

node meitu-tools/scripts/run_command.js --command image-poster-generate \
  --input-json '{"prompt":"Spring sale poster, 50% off"}'

node meitu-tools/scripts/run_command.js --command image-grid-split \
  --input-json '{"image_url":"<valid_grid_image_url>"}'

# 4. Test new params on existing commands
node meitu-tools/scripts/run_command.js --command image-edit \
  --input-json '{"image":["<image_url>"],"prompt":"transform to cartoon","model":"nougat"}'

node meitu-tools/scripts/run_command.js --command image-generate \
  --input-json '{"prompt":"a cute cat","ratio":"16:9"}'
```
