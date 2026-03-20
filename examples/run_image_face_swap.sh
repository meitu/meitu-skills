#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
python3 "$ROOT_DIR/meitu-ai/scripts/run_command.py" \
  --command image-face-swap \
  --input-json '{"head_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","sence_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","prompt":"把第一张图的人脸自然替换到第二张图的人物上，保持光线一致"}'
