#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MEITU_TASK_WAIT_TIMEOUT_MS="${MEITU_TASK_WAIT_TIMEOUT_MS:-600000}" node "$ROOT_DIR/meitu-tools/scripts/run_command.js" \
  --command video-motion-transfer \
  --input-json '{"image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","video_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4","prompt":"使用图片中的人物，按照视频中的动作生成新视频，保持人物身份与风格一致，写实风格"}'
