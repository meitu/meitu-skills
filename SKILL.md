---
name: meitu-skills
description: Root entry skill for Meitu capabilities. Routes requests to article-to-cover for poster design workflows or meitu-tools for direct Meitu CLI tool execution.
---

# meitu-skills (Root Entry)

## Purpose

This is the top-level routing skill:
- Use `article-to-cover` for poster strategy, visual direction, and cover-design workflows.
- Use `meitu-tools` for direct tool execution with the Meitu CLI.

## Routing Rules

1. Use `article-to-cover` when:
- The user provides long-form text, conversation logs, or a design brief.
- The user asks for a poster concept, cover layout, or visual plan.
- The user asks for reference-based redesign, style washing, or mimicry.

2. Use `meitu-tools` when:
- The user wants direct generation/editing execution.
- The user already provides command-like parameters.

## Runtime Bootstrap (Required)

When the route is `meitu-tools`, follow this policy:
- Do not block on manual install questions before first execution.
- Execute through `meitu-tools/scripts/run_command.js` first.
- Let the runner auto-bootstrap runtime (`meitu-ai`) with lazy update enabled by default.
- Only ask the user for manual install/repair steps if runner bootstrap fails.

Manual fallback commands (when bootstrap fails):

```bash
npm install -g meitu-ai
meitu --version
```

If binary conflict (`EEXIST`) is reported:

```bash
npm install -g meitu-ai@latest --force
```

## Tool Capability Map

<!-- BEGIN CAPABILITY_CATALOG -->
- Motion transfer -> `video-motion-transfer`
- Image to video -> `image-to-video`
- Text to video -> `text-to-video`
- Video to GIF -> `video-to-gif`
- Image generate -> `image-generate`
- Poster generate -> `image-poster-generate`
- Image edit -> `image-edit`
- Image upscale -> `image-upscale`
- Beauty enhancement -> `image-beauty-enhance`
- Face swap -> `image-face-swap`
- Virtual try-on -> `image-try-on`
- Image cutout -> `image-cutout`
- Grid split -> `image-grid-split`
<!-- END CAPABILITY_CATALOG -->

## Fallback

When intent is ambiguous:
- Ask one short clarification question: poster workflow or direct tool execution.
- If no reply is provided, default to `meitu-tools` and request minimal required inputs.

## Error Handling

When execution fails, always return actionable guidance instead of raw errors:
- Prioritize `user_hint` and `next_action`.
- If `action_url` exists (for example order/renewal URL), return it directly.
- If `error_type` is `CREDENTIALS_MISSING`, guide the user to configure AK/SK first, then retry.
