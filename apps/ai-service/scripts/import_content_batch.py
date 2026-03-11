from __future__ import annotations

import json
import sys
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.services.import_pipeline import import_batch_from_inbox


if __name__ == "__main__":
    print(json.dumps(import_batch_from_inbox(), ensure_ascii=False, indent=2))
