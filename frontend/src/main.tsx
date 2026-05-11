import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  App as AntApp,
  Button,
  Card,
  ConfigProvider,
  Empty,
  Layout,
  Spin,
  Typography,
  theme,
} from "antd";
import "antd/dist/reset.css";
import "./styles.css";
import { api } from "./api";
import { CurrentQuestion, ReportResponse, SessionResponse } from "./types";

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const reportSections: Array<[keyof ReportResponse["contentJson"], string]> = [
  ["overall", "整体画像概括"],
  ["coreBase", "核心底色"],
  ["personalityStructure", "性格结构"],
  ["behaviorAction", "行为与行动模式"],
  ["innerLoop", "内耗循环"],
  ["relationshipPattern", "关系模式"],
  ["pressureDefense", "压力与防御方式"],
  ["deepNeeds", "深层敏感点与需求"],
];

function Shell({ children, count }: { children: React.ReactNode; count?: number }) {
  const navigate = useNavigate();

  return (
    <Layout className="app-shell">
      <Header className="topbar">
        <div className="topbar-inner">
          <button className="brand-button" onClick={() => navigate("/")}>
            WhoDis
          </button>
          {typeof count === "number" ? <Text className="topbar-count">已完成 {count} 道选择题</Text> : null}
        </div>
      </Header>
      <Content>{children}</Content>
    </Layout>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [loading, setLoading] = useState(false);

  async function start() {
    try {
      setLoading(true);
      const session = await api.createSession();
      navigate(`/chat/${session.id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建访谈失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <main className="home-page">
        <section className="hero">
          <Text className="eyebrow">WhoDis</Text>
          <Title level={1}>生成你的个人画像</Title>
          <Paragraph className="hero-subtitle">
            通过一场由浅入深的选择式访谈，生成一份可导入 AI Agent 的个人画像报告。
          </Paragraph>
          <Button type="primary" size="large" className="primary-cta" loading={loading} onClick={start}>
            开始生成画像
          </Button>
        </section>

        <section className="feature-grid" aria-label="核心说明">
          {[
            ["动态选择式访谈", "固定题库，路径会根据你的选择动态进入不同模块。"],
            ["结构化个人画像", "报告只保留 8 个正文模块，聚焦行为、关系、压力和需求。"],
            ["Agent 可导入上下文", "生成适合复制给其他 AI 助手的上下文和 Skill.md。"],
          ].map(([title, body]) => (
            <Card className="feature-card" key={title}>
              <Title level={3}>{title}</Title>
              <Paragraph>{body}</Paragraph>
            </Card>
          ))}
        </section>
      </main>
    </Shell>
  );
}

function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api
      .getSession(sessionId)
      .then(setSession)
      .catch((error) => message.error(error instanceof Error ? error.message : "读取访谈失败"))
      .finally(() => setLoading(false));
  }, [message, sessionId]);

  const question = session?.currentQuestion ?? null;

  useEffect(() => {
    setSelected(question?.selectedOptionId ?? "");
  }, [question?.id, question?.selectedOptionId]);

  async function selectAndSubmit(optionId: string) {
    if (!sessionId || submitting) return;

    setSelected(optionId);
    try {
      setSubmitting(true);
      const nextSession = await api.answerSession(sessionId, optionId);
      setSession(nextSession);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "提交选择失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function goPrevious() {
    if (!sessionId || submitting || generatingReport || !session?.canGoBack) return;

    try {
      setSubmitting(true);
      const previousSession = await api.previousQuestion(sessionId);
      setSession(previousSession);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "返回上一题失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function generateReport() {
    if (!sessionId) return;

    try {
      setGeneratingReport(true);
      await api.createReport(sessionId);
      navigate(`/report/${sessionId}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "生成报告失败");
    } finally {
      setGeneratingReport(false);
    }
  }

  return (
    <Shell count={session?.questionCount ?? 0}>
      <main className="chat-page">
        {loading ? (
          <div className="center-state">
            <Spin />
          </div>
        ) : question ? (
          <QuestionPanel
            canGoBack={session?.canGoBack ?? false}
            disabled={submitting}
            onPrevious={goPrevious}
            onSelect={selectAndSubmit}
            question={question}
            selected={selected}
          />
        ) : session?.canGenerateReport ? (
          <Card className={generatingReport ? "ready-card ready-card-generating" : "ready-card"}>
            {generatingReport ? (
              <div className="report-generating">
                <Spin size="large" />
                <Title level={2}>正在生成个人画像</Title>
                <Paragraph>正在调用 AI Model 分析你的 30 道选择路径，这可能需要几十秒。</Paragraph>
                <Text className="report-generating-note">请保持当前页面打开，生成完成后会自动进入报告页。</Text>
              </div>
            ) : (
              <>
                <Title level={2}>30 道题已完成</Title>
                <Paragraph>你已完整完成本次选择式访谈，可以生成个人画像报告。</Paragraph>
                <div className="ready-actions">
                  {session.canGoBack ? (
                    <Button disabled={submitting} size="large" onClick={goPrevious}>
                      上一题
                    </Button>
                  ) : null}
                  <Button type="primary" size="large" onClick={generateReport}>
                    生成个人画像
                  </Button>
                </div>
              </>
            )}
          </Card>
        ) : (
          <Empty description="当前没有可回答的问题" />
        )}
      </main>
    </Shell>
  );
}

function QuestionPanel({
  canGoBack,
  disabled,
  onPrevious,
  onSelect,
  question,
  selected,
}: {
  canGoBack: boolean;
  disabled: boolean;
  onPrevious: () => void;
  onSelect: (id: string) => void;
  question: CurrentQuestion;
  selected: string;
}) {
  return (
    <section className="question-panel">
      {/* <Text className="module-label">当前模块：{moduleName(question.module)}</Text> */}
      <Text className="question-count">第 {question.orderNo} / 30 题</Text>
      <Title level={1}>{question.question}</Title>
      <div className="option-list">
        {question.options.map((option) => (
          <button
            className={selected === option.id ? "option-card option-card-selected" : "option-card"}
            disabled={disabled}
            key={option.id}
            onClick={() => onSelect(option.id)}
          >
            <span className="option-id">{option.id}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      <div className="action-row">
        {canGoBack ? (
          <Button disabled={disabled} size="large" onClick={onPrevious}>
            上一题
          </Button>
        ) : null}
      </div>
      {/* <Paragraph className="interview-note">完整完成 30 题后才能生成报告。</Paragraph> */}
    </section>
  );
}

function ReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api
      .getReport(sessionId)
      .then(setReport)
      .catch((error) => message.error(error instanceof Error ? error.message : "读取报告失败"))
      .finally(() => setLoading(false));
  }, [message, sessionId]);

  const fullReportText = useMemo(() => {
    if (!report) return "";
    const main = reportSections.map(([key, title]) => `## ${title}\n${report.contentJson[key]}`).join("\n\n");
    return `${report.title}\n\n${main}\n\n## Agent 可导入上下文\n${report.agentContext}\n\n## Skill.md 内容\n${report.skillMarkdown}`;
  }, [report]);

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    message.success(`${label}已复制`);
  }

  async function restart() {
    const next = await api.createSession();
    navigate(`/chat/${next.id}`);
  }

  return (
    <Shell>
      <main className="report-page">
        {loading ? (
          <div className="center-state">
            <Spin />
          </div>
        ) : report ? (
          <>
            <section className="report-header">
              <div>
                <Title level={1}>{report.title}</Title>
                <Paragraph>这不是标签，也不是诊断，而是一份基于本次选择路径生成的结构化个人画像。</Paragraph>
              </div>
              <div className="report-actions">
                <Button onClick={() => copy("完整报告", fullReportText)}>复制完整报告</Button>
                <Button onClick={() => copy("Agent 上下文", report.agentContext)}>复制 Agent 上下文</Button>
                <Button onClick={() => copy("Skill.md", report.skillMarkdown)}>复制 Skill.md</Button>
                <Button type="primary" onClick={restart}>
                  重新开始
                </Button>
              </div>
            </section>

            <article className="report-sections">
              {reportSections.map(([key, title]) => (
                <Card className="report-card" key={key}>
                  <Title level={2}>{title}</Title>
                  <Paragraph>{report.contentJson[key]}</Paragraph>
                </Card>
              ))}
            </article>

            <Card className="context-card">
              <Title level={2}>Agent 可导入上下文</Title>
              <Paragraph>{report.agentContext}</Paragraph>
            </Card>

            <Card className="context-card">
              <Title level={2}>Skill.md 内容</Title>
              <pre>{report.skillMarkdown}</pre>
            </Card>
          </>
        ) : (
          <Empty description="报告不存在" />
        )}
      </main>
    </Shell>
  );
}

function moduleName(module: string) {
  const names: Record<string, string> = {
    personality_structure: "性格结构",
    behavior_action: "行为与行动模式",
    relationship_pattern: "关系模式",
    pressure_defense: "压力与防御方式",
    core_base: "核心底色",
    inner_loop: "内耗循环",
    deep_needs: "深层敏感点与需求",
  };
  return names[module] ?? module;
}

function Root() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#182232",
          borderRadius: 8,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<ChatPage />} path="/chat/:sessionId" />
            <Route element={<ReportPage />} path="/report/:sessionId" />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
