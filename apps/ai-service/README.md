# AI Service

用于内容解析、教程脚本生成、题目资产生成和评估路由的基础服务。

## 启动

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## 流水线路由

- `POST /pipeline/parse-content`：将教材或讲义文本切成结构化知识单元
- `POST /pipeline/generate-script`：生成教程精读脚本时间线和讲解段落
- `POST /pipeline/build-question-set`：生成题组草案
- `GET /pipeline/source-summary`：查看 `content/raw/` 中课程源数据概览
- `POST /pipeline/build-packages`：从 `content/raw/` 生成 `content/generated/` 教程资产
- `GET /pipeline/generated-manifest`：读取最新生成清单
- `GET /pipeline/release-manifest`：读取最新发布清单
- `GET /pipeline/state`：查看导入作业、审核任务和审核状态统计
- `POST /pipeline/imports`：提交单条教材/讲义导入任务
- `POST /pipeline/imports/batch`：批量扫描 `content/imports/inbox` 并创建导入作业
- `GET /pipeline/imports`：列出当前导入作业
- `GET /pipeline/reviews`：列出审核任务，可按 `status` 过滤
- `GET /pipeline/reviews/{task_id}`：查看单条审核任务详情
- `POST /pipeline/reviews/{task_id}/approve`：审核通过
- `POST /pipeline/reviews/{task_id}/reject`：驳回并要求修改
