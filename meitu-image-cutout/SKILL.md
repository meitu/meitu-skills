---
name: meitu-image-cutout
description: 抠图能力。去除图片背景并输出前景结果，使用内置命令 image-cutout。
---

When to use:
- 用户需要“抠图”。
- 对已有图片做主体分离。

Input contract:
- required: `image`
- optional: `model_type`

Execution:

```bash
python3 "{baseDir}/../meitu-ai/scripts/run_command.py" --command "image-cutout" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
