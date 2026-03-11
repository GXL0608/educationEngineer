# 题库模型 V1

## 题目对象

- `id`
- `stage`
- `subject`
- `course`
- `chapter`
- `knowledgePoints`
- `type`
- `stem`
- `choices`
- `answer`
- `analysis`
- `difficulty`
- `source.kind`
- `source.practiceId`

## 题型范围

- 选择题
- 填空题
- 判断题
- 简答题
- 论述题
- 证明题
- 文献理解题
- 逻辑重建题

## 试卷对象

- `id`
- `title`
- `stage`
- `subject`
- `course`
- `paperType`
- `durationMinutes`
- `sections`
- `questionIds`

## 错题对象

- `userId`
- `questionId`
- `wrongReason`
- `reviewState`
- `nextReviewAt`

## 当前第四阶段落地

- `content/generated/questions/*.json`：单题资产
- `content/generated/papers/*.json`：试卷资产
- `content/generated/question-bank.json`：题库清单索引
- `content/generated/paper-bank.json`：试卷清单索引
- `apps/bff/src/assessment.controller.ts`：题库/试卷查询接口

## 导入与审核持久化

- 导入作业持久化到 `runtime/education_ops.sqlite3`
- 导入草稿写入 `content/review/drafts/`
- 审核通过写入 `content/review/approved/`
- 驳回写入 `content/review/rejected/`
- 审核决策记录写入 `content/review/decisions/`
