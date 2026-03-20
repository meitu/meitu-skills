#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
node "$ROOT_DIR/meitu-tools/scripts/run_command.js" \
  --command image-beauty-enhance \
  --input-json '{"image":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","beatify_type":1}'
