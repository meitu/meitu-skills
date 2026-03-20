---
name: meitu-image-virtual-tryon
description: 试衣能力。将衣服图穿到人物图上，使用内置命令 image-virtual-tryon。
---

When to use:
- 用户需要“试衣”。
- 输入包含衣服图和人物图。

Input contract:
- required: `clothes_image_url`, `person_image_url`
- optional: `replace`, `need_sd`

Execution:

```bash
python3 "{baseDir}/../meitu-ai/scripts/run_command.py" --command "image-virtual-tryon" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
