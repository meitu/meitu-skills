#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
python3 "$ROOT_DIR/meitu-ai/scripts/run_command.py" \
  --command image-cutout \
  --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
