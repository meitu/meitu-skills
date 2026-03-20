---
name: meitu-video-motion-transfer
description: 动作迁移能力。将图片人物动作迁移到目标视频，使用内置命令 video-motion-transfer。
---

When to use:
- 用户需要“动作迁移”。
- 输入是一张图片和一个视频，并希望按提示词生成迁移动画效果。

Input contract:
- required: `image_url`, `video_url`, `prompt`
- optional: none

Execution:

```bash
python3 "{baseDir}/../meitu-ai/scripts/run_command.py" --command "video-motion-transfer" --input-json '<json object>'
```

Output:
- `ok`, `command`, `task_id`, `media_urls`, `result`
