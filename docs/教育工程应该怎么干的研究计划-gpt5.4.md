
人类领导下的多智能体持续运行与规模化调度研究
——面向 Coding / Research / Docs / Ops 的 Skill 体系、调度机制与评估框架

------

## 一、项目摘要

本研究面向一个核心问题：当本地机器、容器集群、云端算力与模型能力持续增强时，人类如何从“单对话操作者”升级为“多智能体组织者”，持续调度 coding、research、docs、ops 等不同类型的 AI agent，形成可长期运行、可扩展、可评估、可治理的生产系统。公开官方资料显示，多智能体在广度优先、可分解的 research 任务上收益显著，但在 coding 场景中并不天然随 agent 数量线性扩张；同时，Skills、Deep Research、Background mode、Compaction、Agent evals 与 Trace grading 等能力已经为长期运行、多步骤协作和系统化评测提供了较成熟的基础设施。([Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system))

本研究拟构建一套“**层级总控 + 黑板任务队列 + 验证者分离**”的混合架构，围绕任务可并行性、agent 组织方式、Skill 体系、长时运行 harness、调度与基础设施、评估与观测、人类领导界面七个方向展开研究，并通过 1 / 4 / 8 / 16 / 32 / 64 agent 实测与 100 / 500 规模仿真，识别多智能体系统的“有效并行前沿”，形成一套可复用的研究方法、原型系统与工程规范。([Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system))

------

## 二、研究背景与立项依据

近两年的官方工程实践表明，LLM 系统正在从单轮问答工具转向带工具、可多轮规划、可长期运行的 agent 工作流。Anthropic 在其多智能体研究系统中采用 orchestrator-worker 结构，由主代理分解问题并并行派生子代理进行搜索；其公开文章指出，该系统在内部 research eval 上相较单代理提升 90.2%，尤其适合 breadth-first 的广度探索型问题。但同一篇文章也明确指出，多智能体代价显著更高，多智能体系统的 token 消耗大约可达普通聊天的 15 倍，而且多数 coding 任务的真实可并行度低于 research。([Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system))

在 agent 组织方法上，Anthropic 的《Building effective agents》提出了一个重要判断：成功的 agent 系统往往并不依赖复杂框架，而是依赖简单、可组合的模式。其文中将并行化、orchestrator-workers、evaluator-optimizer 视为在生产环境中反复验证的核心模式，并特别指出 orchestrator-workers 对多文件 coding 变更与多来源搜索任务具有较高适配度，而 evaluator-optimizer 适用于具备明确评价标准、可迭代改进的工作。([Anthropic](https://www.anthropic.com/engineering/building-effective-agents))

在长时运行方面，Anthropic 公开承认“跨多个 context window 持续推进复杂任务”仍是开放问题，并给出了一套可操作的 harness 方案：由 initializer agent 在首轮建立初始环境，生成 `init.sh`、progress 文件、初始 git 提交与 feature list；后续 coding agent 采用增量推进、读取 git 历史与进度文件、逐项验证并留下结构化交接信息。这说明，所谓“不眠不休”的关键并不只是模型本身，而是外部记忆、清洁交接状态与持续验证机制。([Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents))

在平台能力方面，OpenAI 官方已将 Skill 定义为“带 `SKILL.md` 清单的 versioned bundle”，可用于封装流程、规范、脚本与资源；Deep Research 模型被定位为可搜索、分析并综合数百来源的研究型模型；Background mode 用于可靠执行长任务，Compaction 用于在长会话中压缩上下文并保留关键状态，而 Agent evals 与 Trace grading 则提供了 agent 级质量评估与流程级错误识别能力。上述官方能力为本研究的工程落地提供了直接可用的技术底座。([OpenAI开发者](https://developers.openai.com/api/docs/guides/tools-skills))

------

## 三、研究意义

本研究的意义不在于证明“可以堆到多少个窗口”，而在于建立一套可验证的组织学与工程学框架，回答以下现实问题：
其一，如何把一个人的注意力从“盯一个对话框”升级为“领导一个 agent 团队”；其二，如何把 10 个 agent 组织成一个稳定团队，把 100 个 agent 组织成一个可治理的系统；其三，如何用 Skill、调度、记忆、验证与治理机制，把并行能力转化为真实产出，而不是转化为噪音、冲突和成本膨胀。

本研究的预期价值包括：形成可复用的多智能体研究方法论；建立面向 coding / research / docs / ops 的统一 Skill 规范；识别不同任务的有效并行前沿；沉淀一套可长期运行的 harness 与评估体系；为企业内部 AI 生产系统、研发自动化平台与 agent 工厂化建设提供可实施的蓝图。

------

## 四、研究目标

### 4.1 总体目标

构建一套以“人类领导者”为中心、以“多智能体组织协同”为主体、以“Skill + Harness + Evals”为核心基础设施的持续运行型生产系统，并找到其在不同任务类型下的最优组织方式与规模扩张边界。

### 4.2 具体目标

1. 建立面向四类任务的并行性分类法：coding、research、docs、ops。
2. 设计并验证多智能体组织结构，包括单总控、层级总控、黑板式协作、自由 swarm、market-like 调度等模式。
3. 构建一套可扩张的 Skill 体系，明确 Skill 的最小粒度、触发条件、输入输出、版本管理与评估方法。
4. 设计面向长时运行的外部记忆与交接机制，包括 spec、plan、runbook、progress、feature list、artifact store、git history。
5. 形成一套调度与基础设施方案，覆盖本地、容器、云端的混合执行、任务锁、分支隔离、预算控制、失败重试与回滚。
6. 建立评估框架，系统衡量 throughput、quality、coordination tax、cost、autonomy 五大指标。
7. 产出一个可运行的 V1 原型，支持 8–12 个 agent 稳定协同，并完成更高规模的扩张实验与仿真。

------

## 五、创新点

1. **从“模型能力研究”转向“组织能力研究”**：不再只研究单模型强弱，而是研究人类如何组织多个 agent 形成生产能力。
2. **提出“有效并行前沿”概念**：把系统上限定义为“可独立子任务数、验证吞吐、合并吞吐、人类审阅吞吐、预算上限”中的最小值，而非机器数量本身。
3. **以 Skill 为中观单元**：在 prompt 与 tool 之间引入可版本化、可复用、可评测的技能单元，作为组织协同的标准接口。
4. **将长时运行与评估前置**：把外部记忆、进度交接、验证回路、trace 评估纳入系统核心，而不是事后补丁。
5. **强调“领导界面”而非“窗口堆叠”**：将人类角色从操作员转为目标设定者、优先级管理者、风险裁决者和里程碑审阅者。

------

## 六、核心研究问题与研究假设

### 6.1 核心研究问题

1. 哪些任务真正适合多智能体并行，哪些任务不适合盲目扩张？
2. coding、research、docs、ops 四类任务分别适合什么组织结构？
3. Skill 的最佳粒度是什么，如何避免 Skill 过粗导致僵化、过细导致调度成本过高？
4. 多轮 session、跨 context window 的状态如何稳定传递？
5. 当 agent 数量从 1 扩展到 10、100、500 时，系统最先在哪些环节失效？
6. 人类领导者的最优干预点在哪里，如何最小化注意力消耗同时保持质量与安全？

### 6.2 研究假设

H1：多智能体系统的收益并不随 agent 数量线性上升，其真实上限由“任务独立性 × 验证吞吐 × 合并吞吐 × 人类审阅吞吐 × 预算约束”共同决定。

H2：在高耦合 coding 任务中，“层级总控 + 黑板任务队列 + 验证者分离”将显著优于完全自由 swarm。

H3：外部化记忆（feature list、progress、git、artifact）与会话压缩机制将显著提高长时运行稳定性。

H4：以 eval 驱动的 Skill 演进，将比单纯堆叠 prompt 或盲目增加 agent 数量更能提升系统有效产出。

------

## 七、研究范围与边界

### 7.1 研究范围

本研究覆盖以下对象：

- 任务类型：coding、research、docs、ops。
- 执行环境：本地机器、容器环境、云端算力。
- 规模层级：1 / 4 / 8 / 16 / 32 / 64 agent 实测，100 / 500 规模仿真或抽样实测。
- 系统层面：Skill 体系、调度机制、长时运行、评估体系、人类领导界面。

### 7.2 不纳入本阶段范围

- 无边界权限的全自动互联网行动；
- 无人类裁决的高风险业务闭环；
- 以“完全替代人类领导者”为目标的强自治系统；
- 不可审计、不可回滚、不可评测的黑箱式 agent 平台。

------

## 八、总体技术路线

本研究拟采用“**人类领导者—总控调度—领域经理—工人执行—验证裁决—记忆沉淀—评估反馈**”的闭环路线。整体流程为：

**人类 Leader → 目标定义与优先级 → 总控 Agent → 领域经理 Agent → Worker Agents → Evaluator / Verifier Agents → Merge / Release → Artifact & Memory Store → Evals & Dashboard → 人类复核与再调度**

该路线吸收了官方公开模式中的 orchestrator-workers、parallelization、evaluator-optimizer 等有效结构，同时将 harness、tool documentation、环境反馈与终止条件纳入系统设计，避免把多智能体协作简化为“更多对话窗口”。([Anthropic](https://www.anthropic.com/engineering/building-effective-agents))

------

## 九、研究内容

### 9.1 任务可并行性与工作单元设计研究

本部分研究不同任务的可分解性、耦合度、验证成本与上下文共享需求，形成一套“任务并行性分类法”。拟将任务初步分为四类：
A 类：天然广度型任务，如检索、情报、竞品与法规研究；
B 类：中度并行型任务，如多模块 coding、测试补齐、文档同步；
C 类：高耦合型任务，如大规模架构重构与核心状态逻辑修改；
D 类：流水线型任务，如 triage、release note、依赖升级、日志巡检。

研究目标是定义“可独立工作单元”的标准描述，包括任务边界、输入依赖、所需上下文、验证方式、预期产物、回滚方式与交接格式。Anthropic 的公开实践显示，多智能体最适合广度优先搜索，而 coding 任务通常拥有更少真正可并行的子任务，因此本研究将首先围绕“可独立切分且可验证”的工作单元展开，而不是直接追求 agent 数量最大化。([Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system))

**预期输出**：任务并行性分类法、工作单元 schema、任务切分准则、并行收益曲线。

### 9.2 多智能体组织结构研究

本部分比较五类组织方式：单总控、层级总控、黑板式协作、自由 swarm、market-like 调度。研究重点是比较它们在不同任务类型下的收益、协调税、冲突率与可治理性。基于当前公开证据，本研究将默认采用“层级总控 + 黑板任务队列 + 验证者分离”的混合结构作为主线架构：上层负责目标、优先级与预算；中层负责领域路由与任务分解；下层负责领取任务并回传产物；独立验证者只负责判定质量与是否放行。Anthropic 已公开说明 orchestrator-workers 适合复杂 coding 与搜索任务，且 agent 系统应依赖环境反馈、明确检查点与停止条件。([Anthropic](https://www.anthropic.com/engineering/building-effective-agents))

**预期输出**：组织结构对比报告、V1 组织蓝图、角色职责矩阵。

### 9.3 Skill 体系研究

本部分研究如何以 Skill 作为多智能体协作的标准化能力单元。OpenAI 官方将 Skill 定义为带 `SKILL.md` 的 versioned bundle，可把流程、脚本、规范、模板与资源打包为模块化能力；这意味着 Skill 不应只是“长 prompt”，而应是可路由、可调用、可版本化、可评估的中观单元。([OpenAI开发者](https://developers.openai.com/api/docs/guides/tools-skills))

本研究拟建立五层 Skill taxonomy：
第一层，运行类 Skill，如 env-init、repo-map、task-claim-lock、artifact-handoff；
第二层，规划类 Skill，如 task-decompose、dependency-map、effort-budgeting、routing；
第三层，执行类 Skill，如 file-scoped-edit、bug-repro、test-generation、ci-fix；
第四层，研究与文档类 Skill，如 web-research、citation-builder、spec-distiller、doc-maintainer；
第五层，治理类 Skill，如 cost-governor、permission-check、rollback-checkpoint、trace-auditor。

同时，本研究将制定统一 Skill 模板，至少包括：名称、用途、触发条件、禁止触发条件、输入、依赖工具、步骤、输出物、完成标准、失败回滚、升级条件、版本号与评测集。
**预期输出**：Skill 标准规范、首批 Skill 库、Skill 评测集、Skill 版本演进机制。

### 9.4 长时运行 Harness 与外部记忆研究

本部分聚焦“不眠不休”能力的真实基础：不是让单个 agent 无限记忆，而是让多个 session 之间能够稳定交接。Anthropic 的长时运行实践表明，initializer agent、`init.sh`、feature list、progress file 与 git history 能有效帮助后续 agent 在新 context window 中快速恢复状态；OpenAI 的 Background mode 与 Compaction 则提供了长任务执行与上下文压缩的官方支持。([Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents))

本研究拟建立如下外部记忆标准件：
`SPEC.md`：目标、约束、非目标；
`PLAN.md`：里程碑、依赖与验收标准；
`RUNBOOK.md`：操作规则与常用命令；
`PROGRESS.md`：当前状态、下一步、已知问题；
`FEATURE_LIST.json`：功能与测试通过状态；
`ARTIFACTS/`：中间产物、日志、截图、报表与发布物；
git history / issue board：变更历史与责任链。

**预期输出**：长时运行 harness 设计、交接规范、上下文压缩策略、会话恢复流程。

### 9.5 调度与基础设施研究

本部分研究 agent 如何在本地、容器与云端混合环境中被分配、隔离与回收。核心问题包括：任务如何排队与抢占；同一代码库如何避免冲突；何时允许并发修改、何时必须串行；如何控制预算、限制权限、处理失败重试与快速回滚。

本研究将围绕 worktree / branch / container 三级隔离、任务锁与租约机制、优先级队列、预算阈值、失败重试策略、合并队列、只读研究环境与可写执行环境的分离展开实验。考虑到 500 规模的真实全栈实测成本极高，研究将采用“低规模全量实测 + 高规模离散事件仿真 + 关键点抽样实测”的方式推进。
**预期输出**：调度器原型、资源分配策略、隔离与回滚规范、扩张实验设计。

### 9.6 评估与观测研究

本部分建立 agent 系统的测量体系。Anthropic 明确指出，当评估一个 agent 时，实际评估的是“模型 + harness”的整体；OpenAI 官方则提供 Agent evals 与 Trace grading 作为 workflow 级质量评测能力。由此可见，多智能体系统的评估不能只看最终答案，还必须看整条执行轨迹、工具使用质量与环境真实结果。([Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents))

本研究拟建立五类指标：
**Throughput**：单位时间完成任务数、通过验证的交付数；
**Quality**：正确率、回归率、引用准确率、review 通过率；
**Coordination Tax**：重复劳动率、冲突率、等待时间、无效通信量；
**Cost**：tokens / 任务、工具调用 / 任务、美元 / 任务、计算资源占用；
**Autonomy**：连续自治时长、每百任务人工干预次数、checkpoint 通过率。

同时，研究将建立三层 benchmark：单任务基准、工作流基准、规模化基准。
**预期输出**：指标体系、评测集、在线 dashboard、周度对比报告模板。

### 9.7 人类领导界面研究

本部分研究人类作为“领导者”应看哪些界面、做哪些决策，而不是盯多少个窗口。研究将设计三类主界面：
一是 Portfolio Dashboard，用于查看任务流、资源占用、风险状态与预算消耗；
二是 Escalation Queue，用于集中展示必须由人类裁决的问题；
三是 Milestone Review，用于阶段性审阅代码差异、研究报告、验证结果与回滚点。

本研究的基本原则是：人类不处理每个微任务，而只处理目标、优先级、边界、例外和放行。
**预期输出**：领导界面信息架构、干预策略、人工治理规则。

------

## 十、研究方法与实施方案

本研究采用“文献与官方资料分析 + 原型构建 + 对照实验 + 规模仿真 + 真实案例验证”的综合方法。

第一，开展公开官方资料与工程案例梳理，提炼可复用模式、风险点与设计原则。
第二，构建原型系统，按 V0、V1、V2 三个阶段迭代。
第三，针对 1 / 4 / 8 / 16 / 32 / 64 agent 开展对照实验，比较不同组织结构、不同 Skill 版本、不同记忆机制与不同验证策略。
第四，针对 100 / 500 agent 场景构建仿真模型，估计并行收益、冲突概率、预算曲线与人类审阅瓶颈。
第五，以真实任务集开展案例验证，覆盖 coding、research、docs、ops 四类任务。

研究全程采用“先建立 baseline，再逐项加复杂度”的原则，不以堆栈复杂性替代真实效果提升。

------

## 十一、进度安排

### 阶段一：基线建立（第 1–4 周）

完成需求梳理、任务集建设、指标定义、baseline 单 agent 流程与初版评测集。
**阶段产物**：baseline 报告、任务分类初稿、评测框架初版。

### 阶段二：组织结构与 Skill 原型（第 5–8 周）

完成组织结构设计、Skill 模板规范、首批基础 Skill 与执行 Skill 开发。
**阶段产物**：V0 Skill 库、组织结构草案、任务队列原型。

### 阶段三：长时运行 Harness（第 9–12 周）

完成外部记忆方案、进度交接规范、会话恢复流程、checkpoint 与回滚机制。
**阶段产物**：Harness V1、外部记忆标准件、会话压缩策略。

### 阶段四：V1 系统联调（第 13–16 周）

形成 8–12 agent 的可运行 V1，打通 routing、执行、验证、合并、观测闭环。
**阶段产物**：V1 原型系统、dashboard 初版、周度复盘机制。

### 阶段五：规模实验与仿真（第 17–20 周）

完成 16 / 32 / 64 实测及 100 / 500 仿真，识别失效模式与扩张边界。
**阶段产物**：规模化实验报告、有效并行前沿模型、成本曲线。

### 阶段六：总结与定稿（第 21–24 周）

完成系统优化、规范定稿、最终研究报告与下一阶段建议。
**阶段产物**：正式研究报告、V1 设计文档、Skill 规范文档、扩张路线图。

### 周度例行机制

每周固定执行一次研究复盘，内容包括：
模型与工具变化跟踪、benchmark 重跑、Skill 触发准确率检查、空转/冲突分析、成本回顾、下周假设更新。

------

## 十二、预期成果与考核指标

### 12.1 预期成果

1. 一套《多智能体组织与调度设计规范》。
2. 一套《Skill 编写与评估规范》。
3. 一套长时运行 harness 与外部记忆规范。
4. 一套面向 coding / research / docs / ops 的 benchmark 任务集。
5. 一个支持 8–12 agent 稳定运行的 V1 原型。
6. 一份 1 / 10 / 100 / 500 agent 扩张路线图。
7. 一套领导界面与人工干预规范。
8. 一份最终研究报告与下一阶段建设建议。

### 12.2 建议考核指标

- V1 系统可连续自治运行 4 小时以上，且具备可追踪进度。
- 至少形成 30 个以上可复用 Skill，其中关键 Skill 具备独立评测集。
- 建立不少于 100 个任务样本的 benchmark。
- 在目标任务集中，多 agent 配置相较单 agent 在单位人类注意力产出上有显著提升。
- 周度复盘机制稳定运行，能够定位退化 Skill、冲突热点与成本异常。
- 形成至少一套经过真实任务验证的“层级总控 + 黑板队列 + 验证者分离”生产流程。

------

## 十三、风险分析与应对措施

### 13.1 主要风险

一是“假并行”风险，即 agent 数量增加但有效工作并未增加，只是重复劳动和通信噪声上升。
二是上下文漂移风险，即跨会话后状态丢失、任务边界模糊、交接失真。
三是验证瓶颈风险，即执行速度远超验证与合并速度，导致系统堵塞。
四是成本失控风险，即 token、工具与云资源消耗快速膨胀。
五是治理风险，即权限扩散、越权执行、错误写入与无法回滚。
六是人类过载风险，即本应降低注意力成本的系统反而制造更多待处理事项。

### 13.2 应对措施

- 使用任务锁、租约与黑板式领取机制，降低重复劳动。
- 强制外部记忆与结构化 progress 更新，避免会话失忆。
- 将验证者与执行者分离，设置独立放行条件。
- 建立预算守门人和任务级成本阈值。
- 默认在 sandbox、只读或受限写入环境中执行。
- 设置 kill switch、checkpoint、回滚点与升级规则。
- 将人工介入限制在升级点、冲突点与里程碑放行点，避免把所有决策重新压回给人类。

------

## 十四、组织方式与职责分工

### 14.1 人类领导者职责

负责人类目标设定、优先级管理、资源分配、边界控制、重大风险裁决与里程碑放行，不直接参与每个微任务执行。

### 14.2 系统角色职责

- **总控 Agent**：理解目标、制定计划、分解任务、配置预算与终止条件。
- **领域经理 Agent**：负责某一类任务流，如 coding、research、docs、ops。
- **Worker Agent**：负责领取并执行明确边界的工作单元。
- **Verifier / Judge Agent**：独立验证输出质量、测试结果与放行条件。
- **Memory / Documentation Agent**：维护外部记忆、进度文件与文档一致性。
- **Cost / Safety Agent**：监控预算、权限、联网、回滚与异常行为。

### 14.3 研发协作建议

项目实施层面建议至少设置四条责任线：
平台与调度线、Skill 与流程线、评估与数据线、治理与安全线。
各责任线既要独立承担指标，也要通过统一的 benchmark 和周度复盘机制互相校验。

------

## 十五、主要参考依据（官方）

1. Anthropic：《How we built our multi-agent research system》，2025。([Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system))
2. Anthropic：《Building effective agents》，2024。([Anthropic](https://www.anthropic.com/engineering/building-effective-agents))
3. Anthropic：《Effective harnesses for long-running agents》，2025。([Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents))
4. Anthropic：《Demystifying evals for AI agents》，2026。([Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents))
5. Anthropic：《Building a C compiler with a team of parallel Claudes》，2026。([Anthropic](https://www.anthropic.com/engineering/building-c-compiler))
6. OpenAI API Docs：《Skills》，2026。([OpenAI开发者](https://developers.openai.com/api/docs/guides/tools-skills))
7. OpenAI API Docs：《Deep research》，2026。([OpenAI开发者](https://developers.openai.com/api/docs/guides/deep-research))
8. OpenAI API Docs：《Background mode》，2026。([OpenAI开发者](https://developers.openai.com/api/docs/guides/background?utm_source=chatgpt.com))
9. OpenAI API Docs：《Compaction》，2026。([OpenAI开发者](https://developers.openai.com/api/docs/guides/compaction?utm_source=chatgpt.com))
10. OpenAI API Docs：《Agent evals》与《Trace grading》，2026。([OpenAI开发者](https://developers.openai.com/api/docs/guides/agent-evals?utm_source=chatgpt.com))

------

## 十六、结论

本研究建议把“多智能体协同”视为一个持续演化的工程研究方向，而不是一次性搭建的大系统。真正决定系统上限的，不是屏幕数量，也不是并发窗口数量，而是任务切分质量、Skill 组织能力、长时交接能力、验证吞吐、治理边界与人类领导方式。

因此，本项目的第一目标不是把 agent 堆到最多，而是先把 **8–12 个 agent 组织成一支稳定、可评估、可治理的团队**；在此基础上，再通过系统化实验和仿真，找出从 10 到 100、再到 500 的真实扩张路径。