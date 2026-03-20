#!/usr/bin/env python3
"""Lightweight helper to refresh meitu-tools/generated/manifest.json.

This script intentionally keeps generation logic simple and deterministic.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "meitu-tools" / "generated" / "manifest.json"

payload = {
    "generated": True,
    "aggregated_skill": "meitu-tools",
    "capabilities": [
        "video-motion-transfer",
        "image-edit",
        "image-generate",
        "image-upscale",
        "image-virtual-tryon",
        "image-to-video",
        "image-face-swap",
        "image-cutout",
    ],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(str(OUT))
