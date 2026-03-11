# Import Inbox

## 目录说明

- `inbox/`：等待导入的教材、讲义、讲稿或专题材料 JSON

## 导入对象格式

每个导入文件使用如下字段：

- `stage`：学段
- `subject`：学科
- `title`：内容标题
- `source_name`：来源名，作为导入作业的稳定标识
- `raw_text`：原始正文，多段文本使用空行分隔

## 批量导入

```bash
python3 apps/ai-service/scripts/import_content_batch.py
```

或使用根脚本：

```bash
pnpm content:import-batch
```

## 从导入到发布

1. 导入文件进入 `inbox/`
2. AI 服务创建导入作业和审核任务
3. 审核通过后内容进入 `content/review/approved/`
4. 执行 `pnpm content:release-build`，把审核通过内容并入正式课程宇宙
