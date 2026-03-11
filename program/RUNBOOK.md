# 运行手册

## 多智能体无冲突规则

1. 每个 agent 开始工作前必须先看 `AGENT_WORKBOARD.json`。
2. 未领取任务不得修改对应范围文件。
3. 同一时刻同一任务只能有一个 owner。
4. 执行类任务必须限定文件范围。
5. 所有任务都必须先写任务卡，模板见 `TASK_CARD_TEMPLATE.md`。
6. validator 不能和 owner 相同。
7. 提交前必须更新 `PROGRESS.md` 和工作板状态。

## 推荐分工

- Agent A：课程宇宙与内容模型
- Agent B：页面系统与 Web 客户端
- Agent C：内容工厂与脚本生成
- Agent D：题库与试卷系统
- Agent E：Agent 基建、验证与治理

## 本仓库当前建议边界

- `apps/web/src/pages`：页面工作优先分路由切分
- `apps/web/src/components`：组件工作按组件文件切分
- `apps/bff/src`：API 工作按控制器切分
- `apps/ai-service/app`：AI 服务按路由和模型切分
- `program/*.md`：只允许负责人或总控更新

## 宿主集成 smoke check

1. 通过 query 注入 `hostUserId`
2. 页面侧显示宿主上下文
3. `GET /host/session` 返回 `authenticated` 或明确失败原因
4. 用户态请求带 `x-host-user-id`
5. `lesson_started` 与 `checkpoint_saved` 可发往宿主

## Benchmark 与回滚

- benchmark 任务集：`program/BENCHMARKS/STAGE_A_TASKSET.json`
- trace grading：`program/BENCHMARKS/TRACE_GRADING.md`
- 发布回滚：`program/ARTIFACTS/RELEASE_ROLLBACK_PLAN.md`
