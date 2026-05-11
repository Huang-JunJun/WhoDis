export type SessionStatus = "interviewing" | "ready_to_report" | "completed";

export type QuestionOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
  tags: string[];
  nextHints: string[];
};

export type CurrentQuestion = {
  id: string;
  bankQuestionId: string;
  module: string;
  stage: string;
  question: string;
  options: QuestionOption[];
};

export type SessionResponse = {
  id: string;
  status: SessionStatus;
  questionCount: number;
  canGenerateReport: boolean;
  currentQuestion: CurrentQuestion | null;
};

export type ReportContent = {
  overall: string;
  coreBase: string;
  personalityStructure: string;
  behaviorAction: string;
  innerLoop: string;
  relationshipPattern: string;
  pressureDefense: string;
  deepNeeds: string;
};

export type ReportResponse = {
  id: string;
  sessionId: string;
  title: string;
  contentJson: ReportContent;
  agentContext: string;
  skillMarkdown: string;
  createdAt: string;
};
