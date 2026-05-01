import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clipboard,
  Compass,
  Copy,
  CircleUserRound,
  Factory,
  FileCheck2,
  Home,
  Info,
  MessageCircle,
  RefreshCw,
  Route,
  SlidersHorizontal,
  Terminal,
  Users,
} from "lucide-react";
import "./styles.css";

const questions = [
  {
    stage: "性格外显层",
    question: "你觉得自己平时更接近哪一种人？",
    options: [
      "想得比较多，做决定前会反复权衡",
      "感受比较敏锐，很容易察觉细节和氛围",
      "表面看起来还好，但很多事习惯自己消化",
      "目标感比较强，不太能接受自己原地踏步",
    ],
  },
  {
    stage: "行为模式层",
    question: "遇到一个新任务时，你通常会先做什么？",
    options: [
      "先拆解目标和风险，再开始行动",
      "先试一小步，边做边调整方向",
      "先确认别人期待什么，避免误解",
      "先找最关键的问题，快速推进核心部分",
    ],
  },
  {
    stage: "压力反应层",
    question: "当事情突然失控时，你更容易出现哪种反应？",
    options: [
      "短暂停下来，先恢复判断力",
      "立刻寻找可执行的补救方案",
      "反复回想是不是自己哪里没做好",
      "表面保持稳定，之后才慢慢消化",
    ],
  },
  {
    stage: "关系互动层",
    question: "在人际关系里，你最看重什么？",
    options: [
      "边界清晰，彼此都不用猜",
      "情绪被理解，而不是被评价",
      "长期可靠，关键时刻能承担",
      "沟通高效，不制造额外消耗",
    ],
  },
  {
    stage: "深层需求层",
    question: "什么状态会让你更有安全感？",
    options: [
      "环境可预测，节奏可掌控",
      "身边有人能稳定地支持你",
      "自己持续变强，有更多选择权",
      "问题被说清楚，不再模糊悬着",
    ],
  },
  {
    stage: "Agent 上下文层",
    question: "如果让 AI 助手更懂你，你最希望它注意什么？",
    options: [
      "先帮我厘清问题，再给行动建议",
      "少一点空泛鼓励，多一点具体路径",
      "不要急着贴标签，保留复杂性",
      "提醒风险，但不要制造额外焦虑",
    ],
  },
];

const reportSections = [
  {
    icon: CircleUserRound,
    title: "整体画像概括",
    featured: true,
    body: "在本次评估中，你展现出较强的内在逻辑自洽性。你倾向于在行动前建立清晰的理解框架，能保持客观的观察视角。",
  },
  {
    icon: SlidersHorizontal,
    title: "性格倾向",
    body: "表现出明显的深思熟虑，处理信息时习惯进行多维推演。你更倾向于在低刺激的环境中进行能量修复。",
  },
  {
    icon: Route,
    title: "行为模式",
    body: "任务执行中表现出前置规划周期较长的特征。一旦进入状态，你拥有较高的专注度与持续力。",
  },
  {
    icon: Factory,
    title: "决策与行动模式",
    boxed: true,
    body: "决策过程高度依赖逻辑连贯性，倾向于规避潜在风险。行动触发通常建立在充分的心理建设之上。",
  },
  {
    icon: Users,
    title: "关系互动模式",
    body: "在人际中保持温和的边界感，信任建立较为审慎。一旦确认关系，会表现出高度的责任感与准确的沟通习惯。",
  },
  {
    icon: CheckCircle2,
    title: "压力反应模式",
    body: "中低强度压力下能维持良好的效率，但在高频波动中倾向于暂时抽离。这是一种有效的自我平衡与保护机制。",
  },
  {
    icon: FileCheck2,
    title: "自我评价方式",
    body: "自我评价体系主要由内部标准驱动，对外部评价保持审慎。由于对细节要求较高，偶尔会产生一定的自我施压。",
  },
  {
    icon: Compass,
    title: "当前建议方向",
    advice: [
      "在保持深思熟虑的同时，为非核心事务设定时间止损点。",
      "有意识地在沟通中加入微小的情感反馈，降低关系初期的摩擦。",
      "把面对突发变动时的停顿期视为必要的重组过程，而不是效率损失。",
    ],
  },
];

const agentContext =
  "该用户倾向于在行动前进行较多思考和风险评估，对自己要求较高，遇到不确定结果时容易先自我施压。与该用户沟通时，建议先区分现实问题、情绪问题和行动问题，再给出具体可执行的下一步。避免空泛鼓励、简单贴标签或制造额外焦虑。";

function App() {
  const [view, setView] = useState("home");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [copied, setCopied] = useState("");

  const selected = answers[step];
  const currentQuestion = questions[step];
  const completedCount = Object.keys(answers).length;

  const reportText = useMemo(() => {
    const parts = reportSections.map((section) => {
      if (section.advice) {
        return `${section.title}\n${section.advice.map((item) => `- ${item}`).join("\n")}`;
      }
      return `${section.title}\n${section.body}`;
    });
    return `${parts.join("\n\n")}\n\nAgent 可导入上下文\n${agentContext}`;
  }, []);

  function startInterview() {
    setView("interview");
    setStep(0);
  }

  function chooseOption(optionIndex) {
    setAnswers((prev) => ({ ...prev, [step]: optionIndex }));
  }

  function goNext() {
    if (selected === undefined) return;
    if (step >= questions.length - 1) {
      setView("report");
      return;
    }
    setStep((prev) => prev + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setCopied("");
    setView("home");
  }

  async function copyText(label, text) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  }

  return (
    <div className="app-shell">
      <Header view={view} onNavigate={setView} />
      {view === "home" && <HomePage onStart={startInterview} />}
      {view === "interview" && (
        <InterviewPage
          completedCount={completedCount}
          currentQuestion={currentQuestion}
          onChoose={chooseOption}
          onNext={goNext}
          selected={selected}
          step={step}
        />
      )}
      {view === "report" && (
        <ReportPage
          copied={copied}
          onCopyAgent={() => copyText("agent", agentContext)}
          onCopyReport={() => copyText("report", reportText)}
          onRestart={restart}
        />
      )}
      <BottomNav view={view} onNavigate={setView} />
    </div>
  );
}

function Header({ view, onNavigate }) {
  const items = [
    ["home", "首页"],
    // ["interview", "访谈"],
    // ["report", "画像"],
  ];

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button className="brand" onClick={() => onNavigate("home")}>
          WhoDis
        </button>
        <nav className="desktop-nav" aria-label="主导航">
          {items.map(([id, label]) => (
            <button
              className={view === id ? "nav-link nav-link--active" : "nav-link"}
              key={id}
              onClick={() => onNavigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function HomePage({ onStart }) {
  const features = [
    // {
    //   icon: MessageCircle,
    //   title: "动态选择式访谈",
    //   text: "问题会根据你的选择逐步深入，不是固定题库",
    // },
    // {
    //   icon: Clipboard,
    //   title: "结构化个人画像",
    //   text: "输出性格、行为、决策、关系、压力反应等画像信息",
    // },
    // {
    //   icon: Bot,
    //   title: "Agent 可导入上下文",
    //   text: "生成一段可复制给其他 AI Agent 使用的个人上下文",
    // },
  ];

  return (
    <main className="page page--home">
      <section className="hero">
        <span className="eyebrow">WhoDis</span>
        <h1>生成你的个人画像</h1>
        <p>通过一场由浅入深的选择式访谈，生成一份可导入 AI Agent 的个人画像报告。</p>
        <button className="primary-button primary-button--large" onClick={onStart}>
          开始生成画像
        </button>
      </section>

      <section className="feature-grid" aria-label="核心功能">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article className="feature-card" key={feature.title}>
              <span className="icon-badge">
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function InterviewPage({ completedCount, currentQuestion, onChoose, onNext, selected, step }) {
  return (
    <main className="page page--interview">
      <div className="context-header">
        <div className="label-text">当前阶段：{currentQuestion.stage}</div>
        <div className="small-muted">已完成 {completedCount} 道选择</div>
      </div>

      <section className="question-block">
        <h1>{currentQuestion.question}</h1>
      </section>

      <div className="options-list">
        {currentQuestion.options.map((option, index) => (
          <button
            className={selected === index ? "option option--selected" : "option"}
            key={option}
            onClick={() => onChoose(index)}
          >
            <span className="option__letter">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <div className="interview-actions">
        <span className="step-indicator">
          {step + 1} / {questions.length}
        </span>
        <button className="primary-button" disabled={selected === undefined} onClick={onNext}>
          <span>{step === questions.length - 1 ? "生成报告" : "下一题"}</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <aside className="info-note">
        <Info size={18} />
        <p>完成选择后，系统会判断是否可以生成个人画像；如果信息不足，会继续深入提问。</p>
      </aside>
    </main>
  );
}

function ReportPage({ copied, onCopyAgent, onCopyReport, onRestart }) {
  return (
    <main className="page page--report">
      <section className="report-header">
        <div>
          <h1>WhoDis 个人画像报告</h1>
          <p>这不是标签，也不是诊断，而是一份基于本次选择路径生成的结构化个人画像。</p>
        </div>
        <div className="report-actions">
          <button className="secondary-button" onClick={onCopyReport}>
            <Copy size={16} />
            {copied === "report" ? "已复制" : "复制完整报告"}
          </button>
          <button className="secondary-button secondary-button--strong" onClick={onRestart}>
            <RefreshCw size={16} />
            重新开始
          </button>
        </div>
      </section>

      <article className="report-content">
        {reportSections.map((section) => {
          const Icon = section.icon;
          return (
            <section className="report-section" key={section.title}>
              <h2>
                <Icon size={24} />
                {section.title}
              </h2>
              {section.advice ? (
                <div className="advice-panel">
                  <ul>
                    {section.advice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div
                  className={[
                    section.featured ? "report-card report-card--featured" : "",
                    section.boxed ? "report-card report-card--quiet" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <p>{section.body}</p>
                </div>
              )}
            </section>
          );
        })}

        <section className="agent-context">
          <div className="agent-context__header">
            <div>
              <h2>
                <Terminal size={22} />
                Agent 可导入上下文
              </h2>
              <p>将此结构化数据复制并粘贴给 AI 助手，帮助其更准确地理解你的沟通偏好和思考模型。</p>
            </div>
            <button className="secondary-button" onClick={onCopyAgent}>
              <Copy size={16} />
              {copied === "agent" ? "已复制" : "复制上下文"}
            </button>
          </div>
          <pre>{agentContext}</pre>
        </section>
      </article>
    </main>
  );
}

function BottomNav({ view, onNavigate }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "interview", label: "Interview", icon: MessageCircle },
    { id: "report", label: "Persona", icon: CircleUserRound },
  ];

  return (
    <nav className="bottom-nav" aria-label="移动端导航">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={view === item.id ? "bottom-nav__item bottom-nav__item--active" : "bottom-nav__item"}
            key={item.id}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

createRoot(document.getElementById("root")).render(<App />);
