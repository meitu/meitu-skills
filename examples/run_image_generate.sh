#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
python3 "$ROOT_DIR/meitu-ai/scripts/run_command.py" \
  --command image-generate \
  --input-json '{"prompt":"同样人物，背景改成海边日落，写实风格","image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"size":"2K"}'
