---
name: meitu-image-edit
description: 图片编辑能力。按提示词编辑已有图片，使用内置命令 image-edit。
---

When to use:
- 用户需要“图片编辑”。
- 已有图片，需要局部或整体改图。

Input contract:
- required: `image`, `prompt`
- optional: `size`, `output_format`, `ratio`

Execution:

```bash
python3 "{baseDir}/../meitu-ai/scripts/run_command.py" --command "image-edit" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
