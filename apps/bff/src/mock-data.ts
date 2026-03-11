export type StageId = "K12" | "undergraduate" | "master" | "doctor";

export type StageSummary = {
  id: StageId;
  title: string;
  subtitle: string;
  subjects: number;
};

export type ChapterSummary = {
  id: string;
  title: string;
  summary: string;
  lessonId: string;
  conceptId: string;
  practiceId: string;
  examId: string;
  paperId?: string;
};

export type CourseDetail = {
  id: string;
  stage: StageId;
  subject: string;
  title: string;
  audience: string;
  description: string;
  chapters: ChapterSummary[];
  metrics: {
    lessons: number;
    practices: number;
    reports: string;
  };
};

export const stages: StageSummary[] = [
  {
    id: "K12",
    title: "K12",
    subtitle: "覆盖教材、章节学习、单元练习和阶段测",
    subjects: 9
  },
  {
    id: "undergraduate",
    title: "本科",
    subtitle: "覆盖公共基础课和专业核心课程",
    subjects: 18
  },
  {
    id: "master",
    title: "硕士",
    subtitle: "覆盖研究方法、课程专题和文献综述",
    subjects: 12
  },
  {
    id: "doctor",
    title: "博士",
    subtitle: "覆盖资格考试、前沿文献和研究设计",
    subjects: 8
  }
];

export const courses: CourseDetail[] = [
  {
    id: "k12-physics-forces",
    stage: "K12",
    subject: "物理",
    title: "高中物理：牛顿运动定律",
    audience: "高中物理同步学习 / 单元复习 / 考前强化",
    description: "面向 K12 的精读、概念讲解、例题训练和阶段测闭环。",
    chapters: [
      {
        id: "force-1",
        title: "力与受力分析",
        summary: "建立受力图、平衡条件与常见错误识别。",
        lessonId: "lesson-force-focus",
        conceptId: "concept-force-map",
        practiceId: "practice-force-set",
        examId: "exam-force-unit"
      },
      {
        id: "force-2",
        title: "牛顿第二定律",
        summary: "打通公式理解、推导逻辑和题型迁移。",
        lessonId: "lesson-newton-second",
        conceptId: "concept-newton-second",
        practiceId: "practice-newton-second",
        examId: "exam-newton-second"
      }
    ],
    metrics: {
      lessons: 18,
      practices: 126,
      reports: "单元掌握度 + 错题追踪"
    }
  },
  {
    id: "ug-calculus-series",
    stage: "undergraduate",
    subject: "数学",
    title: "高等数学：级数与收敛性",
    audience: "本科公共基础课 / 期中期末 / 考研前置",
    description: "面向推导型课程的精读、概念结构图和证明题训练。",
    chapters: [
      {
        id: "series-1",
        title: "数项级数与判别法",
        summary: "比较常见判别法和适用边界。",
        lessonId: "lesson-series-criteria",
        conceptId: "concept-series-criteria",
        practiceId: "practice-series-criteria",
        examId: "exam-series-mid"
      }
    ],
    metrics: {
      lessons: 11,
      practices: 82,
      reports: "章节掌握度 + 证明题表现"
    }
  },
  {
    id: "master-research-methods",
    stage: "master",
    subject: "研究方法",
    title: "硕士研究方法：研究问题与研究设计",
    audience: "硕士课程 / 文献综述 / 开题准备",
    description: "将研究问题、方法选择和论证结构拆成教程单元。",
    chapters: [
      {
        id: "rm-1",
        title: "研究问题界定",
        summary: "识别问题、边界、变量和贡献点。",
        lessonId: "lesson-research-question",
        conceptId: "concept-research-frame",
        practiceId: "practice-research-question",
        examId: "exam-research-design",
        paperId: "paper-methodology"
      }
    ],
    metrics: {
      lessons: 9,
      practices: 34,
      reports: "研究路径建议 + 薄弱点提示"
    }
  },
  {
    id: "doctor-frontier-reading",
    stage: "doctor",
    subject: "学术研究",
    title: "博士前沿文献精读：论证链与证据链",
    audience: "博士资格考试 / 前沿阅读 / 论文开题",
    description: "将前沿论文转成结构化论证树和证据链工作台。",
    chapters: [
      {
        id: "phd-1",
        title: "证据链拆解",
        summary: "识别 claim、evidence、gap 与 future work。",
        lessonId: "lesson-evidence-chain",
        conceptId: "concept-evidence-chain",
        practiceId: "practice-evidence-chain",
        examId: "exam-evidence-chain",
        paperId: "paper-frontier-llm"
      }
    ],
    metrics: {
      lessons: 7,
      practices: 20,
      reports: "研究笔记 + 文献结构质量"
    }
  }
];

export const lessons = {
  "lesson-force-focus": {
    id: "lesson-force-focus",
    title: "力与受力分析",
    paragraphs: [
      "第一步不是代公式，而是先把系统边界画清楚。没有边界，所有的力都会混进来。",
      "第二步是区分接触力和场力，再看每个力的方向、作用点和是否成对出现。",
      "第三步才是把受力图转成运动分析，避免把静态图当成运动图。"
    ],
    timeline: [
      { label: "界定研究对象", time: "00:08" },
      { label: "画受力图", time: "00:34" },
      { label: "检查方向与约束", time: "01:10" },
      { label: "迁移到题型", time: "01:46" }
    ]
  },
  "lesson-newton-second": {
    id: "lesson-newton-second",
    title: "牛顿第二定律",
    paragraphs: [
      "牛顿第二定律不是公式套壳，而是力和加速度之间的定量桥梁。",
      "公式中的合力必须来自同一个研究对象、同一个参考系和同一时刻。",
      "题目中的关键不是看到 F=ma，而是识别哪个量是已知、哪个量要通过约束关系联立得到。"
    ],
    timeline: [
      { label: "建立量纲直觉", time: "00:12" },
      { label: "合力和约束关系", time: "00:42" },
      { label: "典型题型迁移", time: "01:22" }
    ]
  },
  "lesson-series-criteria": {
    id: "lesson-series-criteria",
    title: "数项级数与判别法",
    paragraphs: [
      "当你面对级数问题，第一件事不是盲目选判别法，而是先看项的结构。",
      "如果项包含幂、指数、阶乘或对数，判别法的选择顺序就不一样。",
      "同一个级数可以被不同判别法处理，但最优路径取决于比较对象是否自然。"
    ],
    timeline: [
      { label: "识别结构", time: "00:11" },
      { label: "选判别法", time: "00:37" },
      { label: "构造比较对象", time: "01:09" }
    ]
  },
  "lesson-research-question": {
    id: "lesson-research-question",
    title: "研究问题界定",
    paragraphs: [
      "研究问题不是主题名词，而是一个可被回答、可被限定、可被验证的问题表达。",
      "好问题通常同时明确对象、关系、边界和预期贡献。",
      "如果问题无法拆成变量、证据和方法三层，往往说明问题仍然太散。"
    ],
    timeline: [
      { label: "问题与主题的区别", time: "00:09" },
      { label: "四要素拆解", time: "00:31" },
      { label: "研究路径示例", time: "01:04" }
    ]
  },
  "lesson-evidence-chain": {
    id: "lesson-evidence-chain",
    title: "证据链拆解",
    paragraphs: [
      "文献精读时最常见的问题是只记结论，不记结论是如何被支撑起来的。",
      "证据链拆解要求你把 claim、evidence、assumption 和 limitation 分开。",
      "只有当你能复述证据链，你才真正具备研究型阅读能力。"
    ],
    timeline: [
      { label: "识别 claim", time: "00:10" },
      { label: "拆 evidence", time: "00:29" },
      { label: "发现 gap", time: "00:58" }
    ]
  }
} as const;

export const concepts = {
  "concept-force-map": {
    id: "concept-force-map",
    title: "受力分析概念画布",
    nodes: ["研究对象", "接触力", "场力", "约束条件", "受力图", "运动状态"],
    chain: ["先定研究对象", "再列力的来源和方向", "再检查是否遗漏约束", "最后映射到运动分析"]
  },
  "concept-newton-second": {
    id: "concept-newton-second",
    title: "牛顿第二定律关系链",
    nodes: ["研究对象", "合力", "质量", "加速度", "约束关系", "联立求解"],
    chain: ["统一参考系", "列合力", "识别约束", "联立方程", "验证方向"]
  },
  "concept-series-criteria": {
    id: "concept-series-criteria",
    title: "级数判别法决策图",
    nodes: ["项结构", "正项/交错", "比较法", "比值法", "根值法", "积分法"],
    chain: ["先看项结构", "再分正项还是交错", "判别法选择遵循自然比较优先"]
  },
  "concept-research-frame": {
    id: "concept-research-frame",
    title: "研究问题结构图",
    nodes: ["对象", "关系", "边界", "贡献", "方法", "证据"],
    chain: ["主题缩成对象", "对象连到关系", "边界定义样本和情境", "贡献定义为什么值得做"]
  },
  "concept-evidence-chain": {
    id: "concept-evidence-chain",
    title: "证据链拆解图",
    nodes: ["Claim", "Evidence", "Assumption", "Limitation", "Gap", "Future Work"],
    chain: ["先抓 claim", "把 supporting evidence 挂上去", "把假设和局限拆开"]
  }
} as const;

export const practiceSets = {
  "practice-force-set": {
    id: "practice-force-set",
    title: "受力分析训练集",
    items: [
      {
        prompt: "斜面静止木块的受力图中，哪些力一定存在？",
        answer: "重力、支持力；是否存在摩擦力取决于相对滑动趋势。",
        focus: "区分必然力与条件力"
      },
      {
        prompt: "为什么先画研究对象再列力，而不是反过来？",
        answer: "因为力的归属依赖研究对象，研究对象不清就会把外部系统的力混入。",
        focus: "边界优先"
      }
    ]
  },
  "practice-newton-second": {
    id: "practice-newton-second",
    title: "牛顿第二定律训练集",
    items: [
      {
        prompt: "同一题目中合力公式和约束方程为什么必须一起用？",
        answer: "因为未知量往往不止一个，单独用 F=ma 无法解出目标量。",
        focus: "联立求解"
      }
    ]
  },
  "practice-series-criteria": {
    id: "practice-series-criteria",
    title: "级数判别法训练集",
    items: [
      {
        prompt: "面对含阶乘和指数的级数，为什么常优先考虑比值法？",
        answer: "因为相邻项相除后阶乘和指数都能自然化简。",
        focus: "结构决定方法"
      }
    ]
  },
  "practice-research-question": {
    id: "practice-research-question",
    title: "研究问题训练集",
    items: [
      {
        prompt: "“人工智能与教育”为什么不是一个合格研究问题？",
        answer: "因为它只有主题，没有对象、关系、边界和可验证表达。",
        focus: "主题与问题区分"
      }
    ]
  },
  "practice-evidence-chain": {
    id: "practice-evidence-chain",
    title: "证据链拆解训练集",
    items: [
      {
        prompt: "文献中的 limitation 为什么不能并入 evidence？",
        answer: "因为 limitation 描述的是证据边界，不是支持结论的证据本身。",
        focus: "证据边界意识"
      }
    ]
  }
} as const;

export const exams = {
  "exam-force-unit": {
    id: "exam-force-unit",
    title: "受力分析单元卷",
    durationMinutes: 35,
    sections: ["选择题 8 题", "受力图绘制 2 题", "综合分析 1 题"]
  },
  "exam-newton-second": {
    id: "exam-newton-second",
    title: "牛顿第二定律专题卷",
    durationMinutes: 45,
    sections: ["选择题 6 题", "计算题 3 题", "压轴迁移题 1 题"]
  },
  "exam-series-mid": {
    id: "exam-series-mid",
    title: "级数与收敛性章节卷",
    durationMinutes: 60,
    sections: ["基础题 10 题", "证明题 3 题"]
  },
  "exam-research-design": {
    id: "exam-research-design",
    title: "研究设计专题训练",
    durationMinutes: 50,
    sections: ["问题界定 2 题", "方法匹配 2 题", "研究方案评估 1 题"]
  },
  "exam-evidence-chain": {
    id: "exam-evidence-chain",
    title: "文献证据链分析卷",
    durationMinutes: 40,
    sections: ["claim 提取 5 题", "evidence mapping 2 题"]
  }
} as const;

export const researchPapers = {
  "paper-methodology": {
    id: "paper-methodology",
    title: "研究方法工作台",
    paragraphs: lessons["lesson-research-question"].paragraphs,
    nodes: concepts["concept-research-frame"].nodes,
    chain: concepts["concept-research-frame"].chain
  },
  "paper-frontier-llm": {
    id: "paper-frontier-llm",
    title: "前沿文献：证据链拆解",
    paragraphs: lessons["lesson-evidence-chain"].paragraphs,
    nodes: concepts["concept-evidence-chain"].nodes,
    chain: concepts["concept-evidence-chain"].chain
  }
} as const;

export const notes = [
  {
    id: "note-force-1",
    title: "受力分析第一法则",
    tag: "K12 物理",
    summary: "先画研究对象，再列力，最后才进入公式。"
  },
  {
    id: "note-series-1",
    title: "级数判别顺序",
    tag: "本科 数学",
    summary: "结构优先于套路，先识别项型再选方法。"
  },
  {
    id: "note-paper-1",
    title: "证据链拆解模板",
    tag: "博士 文献",
    summary: "claim / evidence / assumption / limitation 四列并排。"
  }
];

export const reportOverview = {
  weeklyFocus: "本周重点从精读转向练习迁移，系统建议先完成牛顿第二定律专题卷。",
  progress: [
    { label: "精读完成率", value: "78%" },
    { label: "概念图掌握度", value: "64%" },
    { label: "错题复盘完成率", value: "42%" },
    { label: "文献结构提取准确率", value: "71%" }
  ],
  weakness: ["受力图遗漏条件力", "研究问题边界过宽", "级数判别法选择不稳定"]
};

export const reviewQueue = [
  {
    title: "受力图中的条件摩擦力",
    reason: "多次把条件力误判为必然力",
    nextReviewAt: "今晚 20:30"
  },
  {
    title: "研究问题边界",
    reason: "问题陈述过宽，无法映射到变量和证据",
    nextReviewAt: "明天 09:00"
  }
];

export const searchIndex = [
  {
    id: "k12-physics-forces",
    type: "course",
    title: "高中物理：牛顿运动定律",
    summary: "K12 物理课程，含精读、概念、练习和专题卷入口。"
  },
  {
    id: "ug-calculus-series",
    type: "course",
    title: "高等数学：级数与收敛性",
    summary: "本科数学课程，覆盖判别法、证明题和章节卷。"
  },
  {
    id: "master-research-methods",
    type: "course",
    title: "硕士研究方法：研究问题与研究设计",
    summary: "研究方法训练路径，连接精读、概念和研究题。"
  },
  {
    id: "doctor-frontier-reading",
    type: "course",
    title: "博士前沿文献精读：论证链与证据链",
    summary: "博士文献工作台，聚焦证据链与论证链。"
  }
];

export function getCourse(courseId: string) {
  return courses.find((course) => course.id === courseId) ?? courses[0];
}

export function getChapter(chapterId: string) {
  for (const course of courses) {
    const chapter = course.chapters.find((item) => item.id === chapterId);
    if (chapter) {
      return {
        course: {
          id: course.id,
          title: course.title,
          subject: course.subject
        },
        chapter
      };
    }
  }

  const fallbackCourse = courses[0];
  return {
    course: {
      id: fallbackCourse.id,
      title: fallbackCourse.title,
      subject: fallbackCourse.subject
    },
    chapter: fallbackCourse.chapters[0]
  };
}

export function getLesson(lessonId: string) {
  return lessons[lessonId as keyof typeof lessons] ?? lessons["lesson-force-focus"];
}

export function getConcept(conceptId: string) {
  return concepts[conceptId as keyof typeof concepts] ?? concepts["concept-force-map"];
}

export function getPractice(practiceId: string) {
  return practiceSets[practiceId as keyof typeof practiceSets] ?? practiceSets["practice-force-set"];
}

export function getExam(examId: string) {
  return exams[examId as keyof typeof exams] ?? exams["exam-force-unit"];
}

export function getResearchPaper(paperId: string) {
  return researchPapers[paperId as keyof typeof researchPapers] ?? researchPapers["paper-frontier-llm"];
}

export function searchContent(query: string) {
  const keyword = query.trim().toLowerCase();

  if (!keyword) {
    return searchIndex;
  }

  return searchIndex.filter(
    (item) => item.title.toLowerCase().includes(keyword) || item.summary.toLowerCase().includes(keyword)
  );
}
