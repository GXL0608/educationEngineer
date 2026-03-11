from __future__ import annotations

import json
import sys
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.services.import_pipeline import apply_review_decision


def main() -> int:
    if len(sys.argv) < 5:
        print(
            json.dumps(
                {
                    "error": "usage: python3 review_import_task.py <task_id> <approved|changes_requested> <reviewer> <notes>"
                },
                ensure_ascii=False,
            )
        )
        return 1

    task_id, decision, reviewer, notes = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    result = apply_review_decision(task_id, reviewer=reviewer, notes=notes, decision=decision)
    if result is None:
        print(json.dumps({"error": "review task not found", "taskId": task_id}, ensure_ascii=False))
        return 2

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
