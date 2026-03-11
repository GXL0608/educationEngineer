from __future__ import annotations

import json
import sys
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.services.content_factory import build_generated_assets


if __name__ == "__main__":
    manifest = build_generated_assets()
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
