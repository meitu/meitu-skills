# Meitu Skills Package

- Package: `meitu-skills`
- Version: `2.0.7`
- Generated At: `2026-06-02 20:35:21`

## Release Notes

update skill docs for latest Designer-tools params

## Routing Addendum

This package uses `meitu-tools` as the direct execution hub for Meitu CLI commands.

For effect commands, refer to `meitu-tools/references/tools.yaml`.

For built-in CLI commands outside `tools.yaml`, the currently verified public console command set is also routed to `meitu-tools`:

- Auth: `meitu auth login`, `meitu auth refresh`, `meitu auth status`, `meitu auth me`, `meitu auth logout`, `meitu auth verify`
- Account: `meitu account overview`, `meitu account usage`
- API key: `meitu api-key list`
- Recharge: `meitu recharge orders`, `meitu recharge order`

Do not assume other built-in console commands are supported by this package just because they exist in `meitu-cli`.

Recommended runtime baseline:
- `meitu-skills 2.0.7`
- `meitu-cli@2.1.7`

## Included Skills

- `PACKAGE_MANIFEST` (./PACKAGE_MANIFEST.json)
- `SECURITY` (./SECURITY.md)
- `SKILL` (./SKILL.md)
- `meitu-tools` (./meitu-tools/SKILL.md)
- `meitu-tools_tools` (./meitu-tools/references/tools.yaml)
- `audio-music-generate` (./skills/audio-music-generate/SKILL.md)
- `audio-song-generate` (./skills/audio-song-generate/SKILL.md)
- `image-background-replace` (./skills/image-background-replace/SKILL.md)
- `image-cutout` (./skills/image-cutout/SKILL.md)
- `image-denoise-enhance` (./skills/image-denoise-enhance/SKILL.md)
- `image-edit` (./skills/image-edit/SKILL.md)
- `image-element-remove` (./skills/image-element-remove/SKILL.md)
- `image-face-swap` (./skills/image-face-swap/SKILL.md)
- `image-grid-split` (./skills/image-grid-split/SKILL.md)
- `image-id-photo-generate` (./skills/image-id-photo-generate/SKILL.md)
- `image-lowlight-enhance` (./skills/image-lowlight-enhance/SKILL.md)
- `image-outfit-swap` (./skills/image-outfit-swap/SKILL.md)
- `image-portrait-generate` (./skills/image-portrait-generate/SKILL.md)
- `image-poster-generate` (./skills/image-poster-generate/SKILL.md)
- `image-search` (./skills/image-search/SKILL.md)
- `image-style-transfer` (./skills/image-style-transfer/SKILL.md)
- `image-superres-enhance` (./skills/image-superres-enhance/SKILL.md)
- `image-text-replace` (./skills/image-text-replace/SKILL.md)
- `image-to-video` (./skills/image-to-video/SKILL.md)
- `image-transform` (./skills/image-transform/SKILL.md)
- `meitu-beauty` (./skills/meitu-beauty/SKILL.md)
- `meitu-carousel` (./skills/meitu-carousel/SKILL.md)
- `meitu-carousel_memory-protocol` (./skills/meitu-carousel/references/memory-protocol.md)
- `meitu-carousel_xiaohongshu-cover` (./skills/meitu-carousel/references/xiaohongshu-cover.md)
- `meitu-cutout` (./skills/meitu-cutout/SKILL.md)
- `meitu-game-2d-assets` (./skills/meitu-game-2d-assets/SKILL.md)
- `meitu-game-2d-assets_prompts` (./skills/meitu-game-2d-assets/references/prompts.md)
- `meitu-id-photo` (./skills/meitu-id-photo/SKILL.md)
- `meitu-id-photo_spec-database` (./skills/meitu-id-photo/references/spec-database.md)
- `meitu-image-adapt` (./skills/meitu-image-adapt/SKILL.md)
- `meitu-image-adapt_platform-presets` (./skills/meitu-image-adapt/references/platform-presets.md)
- `meitu-image-fix` (./skills/meitu-image-fix/SKILL.md)
- `meitu-poster` (./skills/meitu-poster/SKILL.md)
- `meitu-poster_creative-framework` (./skills/meitu-poster/references/creative-framework.md)
- `meitu-poster_design-constraints` (./skills/meitu-poster/references/design-constraints.md)
- `meitu-poster_industry-styles` (./skills/meitu-poster/references/industry-styles.md)
- `meitu-poster_meitu-cli-guide` (./skills/meitu-poster/references/meitu-cli-guide.md)
- `meitu-poster_memory-protocol` (./skills/meitu-poster/references/memory-protocol.md)
- `meitu-poster_output-formats` (./skills/meitu-poster/references/output-formats.md)
- `meitu-poster_poster-analyse` (./skills/meitu-poster/references/poster-analyse.md)
- `meitu-product-swap` (./skills/meitu-product-swap/SKILL.md)
- `meitu-product-swap_prompts` (./skills/meitu-product-swap/references/prompts.md)
- `meitu-product-view` (./skills/meitu-product-view/SKILL.md)
- `meitu-product-view_ecommerce-specs` (./skills/meitu-product-view/references/ecommerce-specs.md)
- `meitu-product-view_prompts` (./skills/meitu-product-view/references/prompts.md)
- `meitu-stickers` (./skills/meitu-stickers/SKILL.md)
- `meitu-stickers_prompts` (./skills/meitu-stickers/references/prompts.md)
- `meitu-upscale` (./skills/meitu-upscale/SKILL.md)
- `meitu-video-dance` (./skills/meitu-video-dance/SKILL.md)
- `meitu-video-dance_input-quality-guide` (./skills/meitu-video-dance/references/input-quality-guide.md)
- `meitu-visual-me` (./skills/meitu-visual-me/SKILL.md)
- `meitu-visual-me_channel-presets` (./skills/meitu-visual-me/references/channel-presets.md)
- `meitu-visual-me_feedback-loop` (./skills/meitu-visual-me/references/feedback-loop.md)
- `meitu-visual-me_first-time-guide` (./skills/meitu-visual-me/references/first-time-guide.md)
- `meitu-visual-me_memory-protocol` (./skills/meitu-visual-me/references/memory-protocol.md)
- `meitu-visual-me_models` (./skills/meitu-visual-me/references/models.md)
- `meitu-visual-me_setup` (./skills/meitu-visual-me/references/setup.md)
- `meitu-visual-me_style-library` (./skills/meitu-visual-me/references/style-library.md)
- `meitu-visual-me_troubleshooting` (./skills/meitu-visual-me/references/troubleshooting.md)
- `meitu-visual-me_workflows` (./skills/meitu-visual-me/references/workflows.md)
- `text-code-edit` (./skills/text-code-edit/SKILL.md)
- `text-code` (./skills/text-code/SKILL.md)
- `text-generate` (./skills/text-generate/SKILL.md)
- `text-to-image` (./skills/text-to-image/SKILL.md)
- `text-to-video` (./skills/text-to-video/SKILL.md)
- `video-audio-add` (./skills/video-audio-add/SKILL.md)
- `video-canvas-expand` (./skills/video-canvas-expand/SKILL.md)
- `video-content-replace` (./skills/video-content-replace/SKILL.md)
- `video-denoise-enhance` (./skills/video-denoise-enhance/SKILL.md)
- `video-effect-apply` (./skills/video-effect-apply/SKILL.md)
- `video-element-remove` (./skills/video-element-remove/SKILL.md)
- `video-framerate-enhance` (./skills/video-framerate-enhance/SKILL.md)
- `video-logo-add` (./skills/video-logo-add/SKILL.md)
- `video-lowlight-enhance` (./skills/video-lowlight-enhance/SKILL.md)
- `video-motion-transfer` (./skills/video-motion-transfer/SKILL.md)
- `video-multimodal-generate` (./skills/video-multimodal-generate/SKILL.md)
- `video-quality-enhance` (./skills/video-quality-enhance/SKILL.md)
- `video-resolution-upscale` (./skills/video-resolution-upscale/SKILL.md)
- `video-stitch` (./skills/video-stitch/SKILL.md)
- `video-to-gif` (./skills/video-to-gif/SKILL.md)