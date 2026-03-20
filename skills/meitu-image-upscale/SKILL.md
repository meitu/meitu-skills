---
name: meitu-image-upscale
description: 图片超清能力。提升图片清晰度和分辨率，使用内置命令 image-upscale。
---

When to use:
- 用户需要“图片超清”。
- 对已有图片进行增强。

Input contract:
- required: `image`
- optional: `model_type`

Execution:

```bash
python3 "{baseDir}/../_shared/run_command.py" --command "image-upscale" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
