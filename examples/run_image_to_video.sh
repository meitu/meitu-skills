#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MEITU_TASK_WAIT_TIMEOUT_MS="${MEITU_TASK_WAIT_TIMEOUT_MS:-600000}" node "$ROOT_DIR/meitu-tools/scripts/run_command.js" \
  --command image-to-video \
  --input-json '{"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"让人物微笑并轻微摆头","video_duration":"5","ratio":"9:16"}'
