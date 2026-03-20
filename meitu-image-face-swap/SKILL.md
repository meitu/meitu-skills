---
name: meitu-image-face-swap
description: 换头像能力。将源头像自然替换到目标场景图，使用内置命令 image-face-swap。
---

When to use:
- 用户需要“换头像/换脸”。
- 输入源脸图与目标场景图。

Input contract:
- required: `head_image_url`, `sence_image_url`, `prompt`
- optional: none

Execution:

```bash
python3 "{baseDir}/../meitu-ai/scripts/run_command.py" --command "image-face-swap" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
