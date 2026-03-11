# 任务卡模板 V1

## YAML 模板

```yaml
task_id: B8-HOST-INTEGRATION-001
objective: 打通宿主上下文注入、真实用户透传和 postMessage 输出
inputs:
  - docs/教育工程最终项目执行计划-多智能体并行版.md
  - program/EMBED_CONTRACT.md
dependencies:
  - B8-WEB-MODULE
owner: A8
deliverable:
  - apps/web/src/lib/host-bridge.ts
  - apps/web/src/store/host-store.ts
validator: A11
acceptance:
  - query/window/postMessage 任一方式可注入 hostUserId
  - 用户态接口默认透传 x-host-user-id
  - lesson_started 与 checkpoint_saved 可输出到宿主
rollback:
  - 恢复到 standalone 模式
  - 停用 host bridge 监听
escalation_trigger:
  - 宿主 token 方案与平台鉴权冲突
  - WebView 桥接在 iOS/Android 表现不一致
```

## 使用规则

- 每个任务卡必须绑定唯一 owner
- validator 不能和 owner 相同
- acceptance 必须可验证，不能写成“基本可用”
- rollback 必须具体到文件、开关或流程
