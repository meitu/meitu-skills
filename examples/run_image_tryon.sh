#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
node "$ROOT_DIR/meitu-tools/scripts/run_command.js" \
  --command image-try-on \
  --input-json '{"clothes_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","person_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","replace":"full","need_sd":"1"}'
