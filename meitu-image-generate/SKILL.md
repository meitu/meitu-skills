---
name: meitu-image-generate
description: 图片生成能力。根据提示词生成图片，可选参考图，使用内置命令 image-generate。
---

When to use:
- 用户需要“图片生成”。
- 文生图，或图文联合生成。

Input contract:
- required: `prompt`
- optional: `image`, `size`

Execution:

```bash
python3 "{baseDir}/../meitu-ai/scripts/run_command.py" --command "image-generate" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
