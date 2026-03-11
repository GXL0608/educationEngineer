# 当前进度

## 已完成

- 总执行计划文档定稿
- 五份研究文档逐段分析稿完成
- 项目骨架执行方案启动
- `program/` 标准件与多智能体工作板落地
- `apps/web` 首发版页面骨架落地
- `apps/bff` API 骨架落地
- `apps/ai-service` 内容处理骨架落地
- `pnpm install` 完成
- Web 构建通过
- BFF 构建通过
- Web 单元测试通过
- AI 服务 Python 编译检查通过
- BFF 健康检查通过
- BFF 已扩展课程、章节、精读、概念、练习、考试、研究、搜索、报告接口
- Web 首页、导航、课程、章节、精读、概念、练习、考试、研究、报告、搜索、笔记、错题页已切为 API 驱动
- Vite dev 代理已配置为 `/api -> BFF`
- `content/raw/` 原始教程源数据已建立
- 内容工厂脚本已可生成 `content/generated/` 结构化教程资产
- BFF 已从 `mock-data` 切换为直接读取 generated 内容资产
- 搜索索引已扩展为课程、章节、精读、概念、练习、考试、研究多实体检索
- AI 服务已增加内容源概览、内容包构建、生成清单接口
- `content/imports/inbox/` 批量导入箱已建立，首批样例导入 2 份
- AI 服务已建立导入作业、审核任务和 SQLite 持久化
- `content/review/` 已建立 drafts / approved / rejected / decisions 审核工作区
- 内容工厂已生成正式题库资产和试卷资产
- BFF 已增加题库和试卷查询接口 `assessment/*`
- 首条导入作业已完成人工审核通过链路验证
- 审核通过内容已可在 release build 时并入正式课程宇宙
- `content/releases/latest.json` 发布清单已落地
- 首条 approved 导入内容已发布为正式课程包 `approved-k12-chemistry-ion-reaction`
- Web 已新增题库中心、试卷中心、发布中心页面
- BFF 已增加发布清单接口 `ops/release-manifest`
- 前端路由已支持导入生成的动态 lesson/concept/practice/exam ID
- `runtime/import-pipeline-state.json` 已作为审核快照供 BFF/前端消费
- `runtime/user-state.json` 已承载用户笔记、复习状态和反馈持久化
- Web 笔记页、复习页、帮助页已接入用户级持久化接口
- Web 已新增审核工作台页面
- 页面级集成测试已覆盖复习页和审核工作台页
- 审核工作台已支持从 Web 端直接审批和退回修改
- BFF 已增加 `user/search-history`、`user/events`、`user/report` 接口
- Web 搜索页已接入搜索历史持久化
- Web 学习报告页已接入用户级行为统计、最近搜索和最近学习活动
- 课程、精读、练习、考试、研究页面已开始写入学习行为事件
- 旧版 `runtime/user-state.json` 已兼容回填新增字段，避免历史用户状态读写失败
- 审批动作、用户搜索历史、学习行为事件、用户报告接口已完成运行态实测
- `runtime/user-state.json` 已新增 `practiceResults` 和 `examResults` 结果级持久化
- Web 练习页已支持按题自评并写入训练结果
- Web 试卷页已支持提交考试得分、用时和薄弱章节
- 学习报告页已汇总结果级统计、结果列表和结果级薄弱点
- 结果级链路已通过页面测试和直接运行时模块验证
- Web 已增加 host bridge bootstrap，支持 query / window / JS bridge / postMessage 四种宿主上下文接入
- 前端请求已自动透传 `x-host-user-id`、`x-host-user-token`、`x-host-locale`、`x-host-device-type` 等宿主头
- BFF 用户态接口已优先按宿主头解析真实用户，不再只依赖 `demo-user`
- Web 已可向宿主输出 `module_ready`、`lesson_started`、`feedback_submitted`、`checkpoint_saved`、`exception_raised`
- BFF 已增加宿主 token registry 校验、全局 host auth guard 和 `GET /host/session` 会话探针
- Web 侧已展示宿主鉴权状态、provider 和 scopes
- `runtime/host-auth-registry.json` 已建立本地可运行的宿主认证注册表
- 审核工作台已支持“通过并发布”，审批后可一键触发 release build
- BFF 已增加 `POST /ops/release-build` 和审批后触发发布返回
- 学习报告已接入课程 / 章节 / 知识点三层掌握度模型与下一步推荐
- 结果持久化已补课程、章节、知识点上下文，用于后续掌握度计算
- `program/EMBED_CONTRACT.md`、`program/COGNITIVE_MECHANISM.md`、`program/DESIGN_SYSTEM.md`、`program/COMPLIANCE_RELEASE_PACK.md` 已补齐
- `program/BENCHMARKS/` 已补 100 任务样本、A/B 实验方案和 trace grading 规则
- `program/ARTIFACTS/` 已补 WebView 回归矩阵、发布回滚方案、自治演练记录和周复盘
- `program/TASK_CARD_TEMPLATE.md` 与 `program/DASHBOARD_V1.md` 已建立
- Web 已新增 host bridge 和 host headers 单测
- BFF 已新增宿主鉴权服务单测

## 正在进行

- 首发版页面细化与组件深化
- 内容工厂和题库系统从首批样例包转入批量扩展实现
- 页面从本地样例数据切换到真实服务后，需要补页面级集成测试
- pending_review 内容仍需人工审核，不得自动进入发布链路
- 题库中心、试卷中心、发布中心仍需做真实 UI 验收和交互细化
- 用户行为数据当前已覆盖搜索、课程进入、精读、练习、考试、研究等主链路，后续还要继续扩到更细颗粒度操作
- 当前结果级数据以自评练习和手动录入考试结果为主，后续仍需接正式判题与自动得分链路
- WebView 实机回归、外部平台正式鉴权接入和 4 小时自治记录仍需真实环境执行

## 下一步

- 将更多审核通过的导入草稿并入正式课程宇宙与发布流水线
- 为题库、试卷和错题链路补更细颗粒度的用户行为持久化
- 将结果级数据从自评模式扩到自动判题、用时统计和题型层指标
- 在宿主容器中执行 WebView 兼容回归和页面级验收
- 给 Web 增加 API 集成测试和关键页面快照
- 为 BFF 增加更多内容工厂和宿主集成接口
- 把掌握度模型继续扩到趋势预测、题型层表现和自动推荐路径
