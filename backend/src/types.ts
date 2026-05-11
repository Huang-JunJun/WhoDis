export type QuestionModule =
  | "overall"
  | "core_base"
  | "personality_structure"
  | "behavior_action"
  | "inner_loop"
  | "relationship_pattern"
  | "pressure_defense"
  | "deep_needs";

export type QuestionStage = "early" | "middle" | "deep" | "closing";
export type OptionId = "A" | "B" | "C" | "D";

export type QuestionOption = {
  id: OptionId;
  text: string;
  tags: string[];
  nextHints: QuestionModule[];
};

export type QuestionItem = {
  id: string;
  module: QuestionModule;
  stage: QuestionStage;
  question: string;
  options: QuestionOption[];
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

export type LlmReportResult = {
  contentJson: ReportContent;
  agentContext: string;
  skillMarkdown: string;
};
