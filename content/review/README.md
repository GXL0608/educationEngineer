# Review Workspace

## 目录说明

- `drafts/`：AI 导入后生成、等待人工审核的结构化草稿
- `approved/`：审核通过的草稿快照
- `rejected/`：被驳回或要求重做的草稿快照
- `decisions/`：每次审核决策记录

第四阶段中，导入作业会先进入 `drafts/`，审核通过后再进入 `approved/`。

## 发布说明

`approved/` 中的内容并不会立即出现在正式课程目录中。

只有执行 release build 后，它们才会进入 `content/generated/` 和 `content/releases/latest.json`。
