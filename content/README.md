# Content Factory

## 目录

- `raw/`：原始课程与内容定义
- `generated/`：由内容工厂脚本生成的教程包、章节包、练习包和报告资产

## 生成

```bash
python3 apps/ai-service/scripts/build_content_packages.py
```

或使用根脚本：

```bash
pnpm content:build
```

显式发布命令：

```bash
pnpm content:release-build
```

## 产物

生成完成后，BFF 会直接从 `content/generated/` 读取资产。当前产物包括：

- `catalog.json`：学段与课程总目录
- `courses/*.json`：课程级教程包
- `chapters/*.json`：章节导航包
- `lessons/*.json`：精读脚本包
- `concepts/*.json`：概念讲解包
- `practices/*.json`：练习题组包
- `exams/*.json`：考试卷包
- `research/*.json`：研究/文献工作台包
- `questions/*.json`：标准化题目资产
- `papers/*.json`：标准化试卷资产
- `notes.json`：笔记卡片
- `report-overview.json`：学习报告摘要
- `review-queue.json`：错题/复习队列
- `search-index.json`：跨课程搜索索引
- `question-bank.json`：题库总清单
- `paper-bank.json`：试卷总清单
- `manifest.json`：本次内容构建清单与统计信息

## 审核通过内容的发布规则

- `content/review/approved/` 中的审核通过内容，会在 release build 时自动并入课程宇宙
- 它们不会直接改写 `content/raw/curriculum-source.json`
- 最新发布清单写入 `content/releases/latest.json`
