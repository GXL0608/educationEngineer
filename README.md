# Education Engineer

本仓库用于落地 [教育工程最终项目执行计划 - 多智能体并行版](/Users/gxl/projects/educationEngineer/docs/教育工程最终项目执行计划-多智能体并行版.md) 的首发版工程骨架。

## 当前结构

- `apps/web`：教育工程可嵌入 Web 模块
- `apps/bff`：宿主集成与应用 API
- `apps/ai-service`：内容解析、脚本生成与评估服务
- `program`：多智能体执行标准件、工作板、课程宇宙、页面地图和进度文件
- `tools`：无冲突协作工具

## 无冲突执行

在多智能体并行执行前，先通过工作板领取任务：

```bash
pnpm task:status
pnpm task:claim AGENT_ID TASK_ID
pnpm task:release AGENT_ID TASK_ID done
```

任务状态写入 `program/AGENT_WORKBOARD.json`，规则见 [program/RUNBOOK.md](/Users/gxl/projects/educationEngineer/program/RUNBOOK.md)。

