from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[4]
CONTENT_DIR = ROOT / "content"
RAW_PATH = CONTENT_DIR / "raw" / "curriculum-source.json"
GENERATED_DIR = CONTENT_DIR / "generated"
RELEASES_DIR = CONTENT_DIR / "releases"
APPROVED_REVIEW_DIR = CONTENT_DIR / "review" / "approved"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: object) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _read_base_source(path: Path = RAW_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return slug or "content"


def _timeline_labels(draft: dict[str, Any]) -> list[str]:
    timeline = draft.get("script", {}).get("timeline", [])
    labels = [item["label"] for item in timeline if item.get("label")]
    return labels or ["问题导入", "概念拆解", "题型迁移"]


def _approved_artifact_paths() -> list[Path]:
    ensure_dir(APPROVED_REVIEW_DIR)
    return sorted(path for path in APPROVED_REVIEW_DIR.glob("*.json") if path.name != ".gitkeep")


def _load_approved_artifacts() -> list[dict[str, Any]]:
    artifacts = []
    for path in _approved_artifact_paths():
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("decision") == "approved":
            artifacts.append(payload)
    return artifacts


def _build_import_course(artifact: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    job = artifact["job"]
    draft = artifact["draft"]
    course_slug = _slugify(job["sourceName"])
    course_id = f"approved-{course_slug}"
    chapter_id = f"{course_id}-chapter-1"
    lesson_id = f"{course_id}-lesson"
    concept_id = f"{course_id}-concept"
    practice_id = f"{course_id}-practice"
    exam_id = f"{course_id}-exam"
    research_id = f"{course_id}-research"
    excerpt = job["metadata"].get("excerpt") or draft["paragraphs"][0]
    knowledge_units = draft["knowledgeUnits"]
    concept_nodes = [unit["name"] for unit in knowledge_units]
    practice_items = [
        {
            "prompt": item["stem"],
            "answer": item["answer"],
            "focus": item["knowledgePoint"],
        }
        for item in draft["questionSet"]["items"]
    ]

    chapter: dict[str, Any] = {
        "id": chapter_id,
        "title": job["title"],
        "summary": excerpt,
        "lesson": {
            "id": lesson_id,
            "title": draft["script"]["title"],
            "paragraphs": draft["script"]["paragraphs"],
            "timeline": draft["script"]["timeline"],
        },
        "concept": {
            "id": concept_id,
            "title": f"{job['title']} 概念图",
            "nodes": concept_nodes,
            "chain": _timeline_labels(draft),
        },
        "practice": {
            "id": practice_id,
            "title": draft["questionSet"]["title"],
            "items": practice_items,
        },
        "exam": {
            "id": exam_id,
            "title": f"{job['title']} 导入专题卷",
            "durationMinutes": max(30, len(practice_items) * 12),
            "sections": [
                f"导入题 {len(practice_items)} 题",
                "迁移解释 1 题",
            ],
        },
    }

    include_research = any(unit["kind"] == "research" for unit in knowledge_units) or job["stage"] in {"master", "doctor"}
    if include_research:
        chapter["research"] = {
            "id": research_id,
            "title": f"{job['title']} 研究工作台",
            "paragraphs": draft["paragraphs"],
            "nodes": concept_nodes,
            "chain": _timeline_labels(draft),
        }

    course = {
        "id": course_id,
        "stage": job["stage"],
        "subject": job["subject"],
        "title": job["title"],
        "audience": f"{job['stage']} {job['subject']} 导入专题 / 审核通过内容",
        "description": "由审核通过的导入内容自动转换为正式课程包，进入课程宇宙发布链路。",
        "metrics": {
            "lessons": 1,
            "practices": len(practice_items),
            "reports": "导入专题学习报告 + 审核追踪",
        },
        "chapters": [chapter],
        "origin": {
            "kind": "approved_import",
            "sourceName": job["sourceName"],
            "reviewArtifactPath": artifact["job"]["artifactPath"],
            "reviewedBy": artifact["reviewer"],
        },
    }
    note = {
        "id": f"note-{course_id}",
        "title": job["title"],
        "tag": f"{job['stage']} {job['subject']} 导入",
        "summary": excerpt,
    }
    return course, note


def load_source(path: Path = RAW_PATH, *, include_approved: bool = True) -> dict[str, Any]:
    source = _read_base_source(path)

    if not include_approved:
        source["_approvedImports"] = []
        return source

    merged = json.loads(json.dumps(source, ensure_ascii=False))
    existing_course_ids = {course["id"] for course in merged["courses"]}
    existing_note_ids = {note["id"] for note in merged["notes"]}
    approved_imports: list[dict[str, Any]] = []

    for artifact in _load_approved_artifacts():
        course, note = _build_import_course(artifact)
        if course["id"] not in existing_course_ids:
            merged["courses"].append(course)
            existing_course_ids.add(course["id"])
        if note["id"] not in existing_note_ids:
            merged["notes"].append(note)
            existing_note_ids.add(note["id"])
        approved_imports.append(
            {
                "courseId": course["id"],
                "title": course["title"],
                "stage": course["stage"],
                "subject": course["subject"],
                "sourceName": artifact["job"]["sourceName"],
                "artifactPath": artifact["job"]["artifactPath"],
            }
        )

    merged["_approvedImports"] = approved_imports
    return merged


def summarize_source(source: dict[str, Any] | None = None) -> dict[str, Any]:
    source = source or load_source()
    chapter_count = sum(len(course["chapters"]) for course in source["courses"])
    approved_imports = source.get("_approvedImports", [])

    return {
        "sourcePath": str(RAW_PATH.relative_to(ROOT)),
        "stageCount": len(source["stages"]),
        "courseCount": len(source["courses"]),
        "chapterCount": chapter_count,
        "noteCount": len(source["notes"]),
        "reviewCount": len(source["reviewQueue"]),
        "approvedImportCount": len(approved_imports),
        "approvedImports": approved_imports,
        "courses": [
            {
                "id": course["id"],
                "stage": course["stage"],
                "subject": course["subject"],
                "title": course["title"],
                "chapterCount": len(course["chapters"]),
            }
            for course in source["courses"]
        ],
    }


def _append_search_item(items: list[dict[str, str]], *, item_id: str, item_type: str, title: str, summary: str) -> None:
    items.append({"id": item_id, "type": item_type, "title": title, "summary": summary})


def _first_sentence(paragraphs: list[str], fallback: str) -> str:
    return paragraphs[0] if paragraphs else fallback


def _infer_question_type(stage: str) -> str:
    return {
        "K12": "简答题",
        "undergraduate": "证明题",
        "master": "论述题",
        "doctor": "文献理解题",
    }.get(stage, "简答题")


def _infer_difficulty(stage: str, index: int) -> str:
    mapping = {
        "K12": ["easy", "medium", "medium"],
        "undergraduate": ["medium", "medium", "hard"],
        "master": ["medium", "hard", "hard"],
        "doctor": ["hard", "hard", "hard"],
    }
    levels = mapping.get(stage, ["medium", "medium", "hard"])
    return levels[min(index, len(levels) - 1)]


def _section_target_count(label: str, fallback: int) -> int:
    match = re.search(r"(\d+)\s*题", label)
    if match:
        return int(match.group(1))
    return fallback


def _allocate_question_ids(question_ids: list[str], section_index: int, section_total: int) -> list[str]:
    if not question_ids:
        return []
    return [question_id for index, question_id in enumerate(question_ids) if index % section_total == section_index]


def build_generated_assets(
    source: dict[str, Any] | None = None,
    *,
    output_dir: Path = GENERATED_DIR,
) -> dict[str, Any]:
    source = source or load_source()
    stage_titles = {stage["id"]: stage["title"] for stage in source["stages"]}
    approved_imports = source.get("_approvedImports", [])

    catalog = {"stages": source["stages"], "courses": []}
    lessons: dict[str, dict[str, Any]] = {}
    concepts: dict[str, dict[str, Any]] = {}
    practices: dict[str, dict[str, Any]] = {}
    exams: dict[str, dict[str, Any]] = {}
    research: dict[str, dict[str, Any]] = {}
    chapters: dict[str, dict[str, Any]] = {}
    questions: dict[str, dict[str, Any]] = {}
    papers: dict[str, dict[str, Any]] = {}
    search_index: list[dict[str, str]] = []
    question_bank_items: list[dict[str, Any]] = []
    paper_bank_items: list[dict[str, Any]] = []

    for course in source["courses"]:
        course_chapters = []

        _append_search_item(
            search_index,
            item_id=course["id"],
            item_type="course",
            title=course["title"],
            summary=f"{stage_titles.get(course['stage'], course['stage'])} {course['subject']} 课程，含精读、概念、练习、考试和研究入口。",
        )

        for chapter in course["chapters"]:
            lesson = chapter["lesson"]
            concept = chapter["concept"]
            practice = chapter["practice"]
            exam = chapter["exam"]

            lessons[lesson["id"]] = lesson
            concepts[concept["id"]] = concept
            practices[practice["id"]] = practice
            exams[exam["id"]] = exam

            chapter_summary = {
                "id": chapter["id"],
                "title": chapter["title"],
                "summary": chapter["summary"],
                "lessonId": lesson["id"],
                "conceptId": concept["id"],
                "practiceId": practice["id"],
                "examId": exam["id"],
            }

            if "research" in chapter:
                research_obj = chapter["research"]
                research[research_obj["id"]] = research_obj
                chapter_summary["paperId"] = research_obj["id"]
                _append_search_item(
                    search_index,
                    item_id=research_obj["id"],
                    item_type="research",
                    title=research_obj["title"],
                    summary=_first_sentence(research_obj["paragraphs"], chapter["summary"]),
                )

            chapters[chapter["id"]] = {
                "course": {
                    "id": course["id"],
                    "title": course["title"],
                    "subject": course["subject"],
                },
                "chapter": chapter_summary,
            }
            course_chapters.append(chapter_summary)

            chapter_question_ids: list[str] = []
            for question_index, practice_item in enumerate(practice["items"]):
                question_id = f"question-{practice['id']}-{question_index + 1}"
                question_payload = {
                    "id": question_id,
                    "stage": course["stage"],
                    "subject": course["subject"],
                    "course": {"id": course["id"], "title": course["title"]},
                    "chapter": {"id": chapter["id"], "title": chapter["title"]},
                    "knowledgePoints": [concept["title"], practice_item["focus"]],
                    "type": _infer_question_type(course["stage"]),
                    "stem": practice_item["prompt"],
                    "choices": [],
                    "answer": practice_item["answer"],
                    "analysis": practice_item["focus"],
                    "difficulty": _infer_difficulty(course["stage"], question_index),
                    "source": {"kind": "practice", "practiceId": practice["id"]},
                }
                questions[question_id] = question_payload
                chapter_question_ids.append(question_id)
                question_bank_items.append(
                    {
                        "id": question_id,
                        "stage": course["stage"],
                        "subject": course["subject"],
                        "courseId": course["id"],
                        "chapterId": chapter["id"],
                        "type": question_payload["type"],
                        "difficulty": question_payload["difficulty"],
                        "knowledgePoints": question_payload["knowledgePoints"],
                        "stem": question_payload["stem"],
                    }
                )

            paper_sections = []
            for section_index, section_label in enumerate(exam["sections"]):
                paper_sections.append(
                    {
                        "id": f"{exam['id']}-section-{section_index + 1}",
                        "title": section_label,
                        "targetCount": _section_target_count(section_label, len(chapter_question_ids)),
                        "questionIds": _allocate_question_ids(chapter_question_ids, section_index, len(exam["sections"])),
                    }
                )

            paper_payload = {
                "id": exam["id"],
                "title": exam["title"],
                "stage": course["stage"],
                "subject": course["subject"],
                "course": {"id": course["id"], "title": course["title"]},
                "chapter": {"id": chapter["id"], "title": chapter["title"]},
                "paperType": "chapter_exam",
                "durationMinutes": exam["durationMinutes"],
                "questionIds": chapter_question_ids,
                "sections": paper_sections,
            }
            papers[exam["id"]] = paper_payload
            paper_bank_items.append(
                {
                    "id": exam["id"],
                    "stage": course["stage"],
                    "subject": course["subject"],
                    "courseId": course["id"],
                    "chapterId": chapter["id"],
                    "title": exam["title"],
                    "paperType": "chapter_exam",
                    "durationMinutes": exam["durationMinutes"],
                    "questionCount": len(chapter_question_ids),
                }
            )

            _append_search_item(
                search_index,
                item_id=chapter["id"],
                item_type="chapter",
                title=f"{course['title']} / {chapter['title']}",
                summary=chapter["summary"],
            )
            _append_search_item(
                search_index,
                item_id=lesson["id"],
                item_type="lesson",
                title=lesson["title"],
                summary=_first_sentence(lesson["paragraphs"], chapter["summary"]),
            )
            _append_search_item(
                search_index,
                item_id=concept["id"],
                item_type="concept",
                title=concept["title"],
                summary=" / ".join(concept["chain"][:2]) or chapter["summary"],
            )
            _append_search_item(
                search_index,
                item_id=practice["id"],
                item_type="practice",
                title=practice["title"],
                summary=practice["items"][0]["focus"] if practice["items"] else chapter["summary"],
            )
            _append_search_item(
                search_index,
                item_id=exam["id"],
                item_type="exam",
                title=exam["title"],
                summary=f"{exam['durationMinutes']} 分钟 · {' / '.join(exam['sections'])}",
            )

        course_detail = {
            "id": course["id"],
            "stage": course["stage"],
            "subject": course["subject"],
            "title": course["title"],
            "audience": course["audience"],
            "description": course["description"],
            "chapters": course_chapters,
            "metrics": course["metrics"],
        }

        catalog["courses"].append(course_detail)
        write_json(output_dir / "courses" / f"{course['id']}.json", course_detail)

    write_json(output_dir / "catalog.json", catalog)

    for lesson_id, payload in lessons.items():
        write_json(output_dir / "lessons" / f"{lesson_id}.json", payload)

    for concept_id, payload in concepts.items():
        write_json(output_dir / "concepts" / f"{concept_id}.json", payload)

    for practice_id, payload in practices.items():
        write_json(output_dir / "practices" / f"{practice_id}.json", payload)

    for exam_id, payload in exams.items():
        write_json(output_dir / "exams" / f"{exam_id}.json", payload)

    for research_id, payload in research.items():
        write_json(output_dir / "research" / f"{research_id}.json", payload)

    for chapter_id, payload in chapters.items():
        write_json(output_dir / "chapters" / f"{chapter_id}.json", payload)

    for question_id, payload in questions.items():
        write_json(output_dir / "questions" / f"{question_id}.json", payload)

    for paper_id, payload in papers.items():
        write_json(output_dir / "papers" / f"{paper_id}.json", payload)

    write_json(output_dir / "notes.json", {"items": source["notes"]})
    write_json(output_dir / "report-overview.json", source["reportOverview"])
    write_json(output_dir / "review-queue.json", {"items": source["reviewQueue"]})
    write_json(output_dir / "search-index.json", {"items": search_index})
    write_json(output_dir / "question-bank.json", {"items": question_bank_items})
    write_json(output_dir / "paper-bank.json", {"items": paper_bank_items})

    manifest = {
        "builtAt": utc_now(),
        "sourcePath": str(RAW_PATH.relative_to(ROOT)),
        "outputDir": str(output_dir.relative_to(ROOT)),
        "stageCount": len(catalog["stages"]),
        "courseCount": len(catalog["courses"]),
        "chapterCount": len(chapters),
        "lessonCount": len(lessons),
        "conceptCount": len(concepts),
        "practiceCount": len(practices),
        "examCount": len(exams),
        "researchCount": len(research),
        "questionCount": len(questions),
        "paperCount": len(papers),
        "noteCount": len(source["notes"]),
        "reviewCount": len(source["reviewQueue"]),
        "searchIndexCount": len(search_index),
        "approvedImportCount": len(approved_imports),
        "approvedImports": approved_imports,
        "courses": [{"id": course["id"], "title": course["title"]} for course in catalog["courses"]],
    }
    write_json(output_dir / "manifest.json", manifest)
    write_json(
        RELEASES_DIR / "latest.json",
        {
            "builtAt": manifest["builtAt"],
            "catalogPath": str((output_dir / "catalog.json").relative_to(ROOT)),
            "manifestPath": str((output_dir / "manifest.json").relative_to(ROOT)),
            "courseCount": manifest["courseCount"],
            "questionCount": manifest["questionCount"],
            "paperCount": manifest["paperCount"],
            "approvedImportCount": manifest["approvedImportCount"],
            "approvedImports": approved_imports,
        },
    )

    return manifest


def read_generated_manifest(output_dir: Path = GENERATED_DIR) -> dict[str, Any]:
    manifest_path = output_dir / "manifest.json"
    if not manifest_path.exists():
        return build_generated_assets(output_dir=output_dir)
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def read_release_manifest() -> dict[str, Any]:
    manifest_path = RELEASES_DIR / "latest.json"
    if not manifest_path.exists():
        build_generated_assets()
    return json.loads(manifest_path.read_text(encoding="utf-8"))
