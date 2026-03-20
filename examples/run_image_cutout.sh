#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
node "$ROOT_DIR/meitu-tools/scripts/run_command.js" \
  --command image-cutout \
  --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
