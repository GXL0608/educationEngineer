from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[4]
RUNTIME_DIR = ROOT / "runtime"
DB_PATH = RUNTIME_DIR / "education_ops.sqlite3"


def ensure_runtime_dir() -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def get_connection() -> sqlite3.Connection:
    ensure_runtime_dir()
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS import_jobs (
            id TEXT PRIMARY KEY,
            source_name TEXT NOT NULL UNIQUE,
            stage TEXT NOT NULL,
            subject TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            draft_path TEXT NOT NULL,
            source_path TEXT,
            artifact_path TEXT,
            metadata_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS review_tasks (
            id TEXT PRIMARY KEY,
            import_job_id TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            reviewer TEXT,
            notes TEXT,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(import_job_id) REFERENCES import_jobs(id)
        );
        """
    )
    return connection


def _decode_json(value: str) -> Any:
    return json.loads(value) if value else None


def _row_to_import_job(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None

    return {
        "id": row["id"],
        "sourceName": row["source_name"],
        "stage": row["stage"],
        "subject": row["subject"],
        "title": row["title"],
        "status": row["status"],
        "draftPath": row["draft_path"],
        "sourcePath": row["source_path"],
        "artifactPath": row["artifact_path"],
        "metadata": _decode_json(row["metadata_json"]),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def _row_to_review_task(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None

    return {
        "id": row["id"],
        "importJobId": row["import_job_id"],
        "title": row["title"],
        "status": row["status"],
        "reviewer": row["reviewer"],
        "notes": row["notes"],
        "payload": _decode_json(row["payload_json"]),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def find_import_job_by_source_name(source_name: str) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM import_jobs WHERE source_name = ?",
            (source_name,),
        ).fetchone()
    return _row_to_import_job(row)


def get_import_job(job_id: str) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM import_jobs WHERE id = ?", (job_id,)).fetchone()
    return _row_to_import_job(row)


def list_import_jobs() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM import_jobs ORDER BY created_at DESC").fetchall()
    return [_row_to_import_job(row) for row in rows if row is not None]


def insert_import_job(job: dict[str, Any]) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO import_jobs (
                id, source_name, stage, subject, title, status, draft_path, source_path, artifact_path,
                metadata_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job["id"],
                job["sourceName"],
                job["stage"],
                job["subject"],
                job["title"],
                job["status"],
                job["draftPath"],
                job.get("sourcePath"),
                job.get("artifactPath"),
                json.dumps(job["metadata"], ensure_ascii=False),
                job["createdAt"],
                job["updatedAt"],
            ),
        )


def update_import_job(job_id: str, *, status: str, artifact_path: str | None, metadata: dict[str, Any]) -> dict[str, Any] | None:
    updated_at = utc_now()
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE import_jobs
            SET status = ?, artifact_path = ?, metadata_json = ?, updated_at = ?
            WHERE id = ?
            """,
            (status, artifact_path, json.dumps(metadata, ensure_ascii=False), updated_at, job_id),
        )
        row = connection.execute("SELECT * FROM import_jobs WHERE id = ?", (job_id,)).fetchone()
    return _row_to_import_job(row)


def get_review_task(task_id: str) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM review_tasks WHERE id = ?", (task_id,)).fetchone()
    return _row_to_review_task(row)


def list_review_tasks(status: str | None = None) -> list[dict[str, Any]]:
    with get_connection() as connection:
        if status:
            rows = connection.execute(
                "SELECT * FROM review_tasks WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = connection.execute("SELECT * FROM review_tasks ORDER BY created_at DESC").fetchall()
    return [_row_to_review_task(row) for row in rows if row is not None]


def insert_review_task(task: dict[str, Any]) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO review_tasks (
                id, import_job_id, title, status, reviewer, notes, payload_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                task["id"],
                task["importJobId"],
                task["title"],
                task["status"],
                task.get("reviewer"),
                task.get("notes"),
                json.dumps(task["payload"], ensure_ascii=False),
                task["createdAt"],
                task["updatedAt"],
            ),
        )


def update_review_task(
    task_id: str,
    *,
    status: str,
    reviewer: str,
    notes: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    updated_at = utc_now()
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE review_tasks
            SET status = ?, reviewer = ?, notes = ?, payload_json = ?, updated_at = ?
            WHERE id = ?
            """,
            (status, reviewer, notes, json.dumps(payload, ensure_ascii=False), updated_at, task_id),
        )
        row = connection.execute("SELECT * FROM review_tasks WHERE id = ?", (task_id,)).fetchone()
    return _row_to_review_task(row)
