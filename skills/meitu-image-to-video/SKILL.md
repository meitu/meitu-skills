---
name: meitu-image-to-video
description: 图生视频能力。根据图片与提示词生成视频，使用内置命令 image-to-video。
---

When to use:
- 用户需要“图生视频”。
- 输入一张图片并提供视频生成描述。

Input contract:
- required: `image`, `prompt`
- optional: `video_duration`, `ratio`

Execution:

```bash
python3 "{baseDir}/../_shared/run_command.py" --command "image-to-video" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
