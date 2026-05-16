import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { LlmReportResult, LlmSkillResult, ReportContent } from "./types";

export type LlmAnswerInput = {
  orderNo: number;
  module: string;
  questionText: string;
  selectedOptionText: string;
  selectedTags: string[];
};

export type LlmReportInput = {
  answers: LlmAnswerInput[];
  tagSummary: Record<string, number>;
  moduleCounts: Record<string, number>;
};

export type LlmSkillInput = {
  contentJson: ReportContent;
  agentContext: string;
  tagSummary: Record<string, number>;
  moduleCounts: Record<string, number>;
};

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const reportKeys: Array<keyof ReportContent> = [
  "overall",
  "coreBase",
  "personalityStructure",
  "behaviorAction",
  "innerLoop",
  "relationshipPattern",
  "pressureDefense",
  "deepNeeds",
];

@Injectable()
export class LlmService {
  async generateReport(input: LlmReportInput): Promise<LlmReportResult> {
    this.assertProvider();
    return this.generateWithDeepSeek<LlmReportResult>({
      input,
      systemPrompt: this.buildReportSystemPrompt(),
      validate: (content) => this.parseAndValidateReport(content),
    });
  }

  async generateSkillMarkdown(input: LlmSkillInput): Promise<LlmSkillResult> {
    this.assertProvider();
    return this.generateWithDeepSeek<LlmSkillResult>({
      input,
      systemPrompt: this.buildSkillSystemPrompt(),
      validate: (content) => this.parseAndValidateSkill(content),
    });
  }

  private assertProvider() {
    const provider = process.env.LLM_PROVIDER;
    if (provider !== "deepseek") {
      throw new BadRequestException("模型调用失败：暂不支持当前 LLM_PROVIDER");
    }
  }

  private async generateWithDeepSeek<T>({
    input,
    systemPrompt,
    validate,
  }: {
    input: unknown;
    systemPrompt: string;
    validate: (content: string) => T;
  }): Promise<T> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

    if (!apiKey) {
      throw new BadRequestException("模型调用失败：缺少 DEEPSEEK_API_KEY");
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: JSON.stringify(input, null, 2),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 7000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `DeepSeek request failed: ${response.status}`);
      }

      const data = (await response.json()) as DeepSeekChatResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("DeepSeek response has no content");
      }

      return validate(content);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown error";
      throw new InternalServerErrorException(`模型调用失败：${detail}`);
    }
  }

  private buildReportSystemPrompt() {
    return `你是 WhoDis 的报告生成器，只能根据用户完成的固定选择题路径生成报告。

重要边界：
- 不要生成题目。
- 不要修改题库机制。
- 不要输出 MBTI。
- 不要输出“人格类型”。
- 不要写“你是 XX 型人格”。
- 不要使用“AI 眼中的你”。
- 不要做心理诊断、医学诊断或治疗建议。
- 不要使用恐吓式、绝对化、病理化表达。

输入说明：
- 你收到的是用户已经完成的 30 道选择题摘要。
- 每道题只包含：题号、模块、题目文本、用户选中的选项文本、selectedTags。
- 另外还会提供 tagSummary 和 moduleCounts。
- 不会提供未选项全文，你必须基于“用户实际选择了什么”做分析，不要臆造未选择内容。

分析要求：
- 重点总结用户的稳定偏好、行动方式、关系处理、压力反应和深层需求。
- 不要只复述 tags，也不要把 tags 机械翻译成句子。
- 每个正文模块都要写出具体情境、典型表现、容易卡住的机制、适合的支持方式。
- 内容要充实、具体、贴近用户选择路径，避免空洞套话。
- 不要使用“可能是因为原生家庭”等无依据推断。
- 不要臆造用户没有回答过的事实。

必须返回严格 JSON，不要返回 Markdown 包裹，不要解释。

JSON 结构必须是：
{
  "contentJson": {
    "overall": "",
    "coreBase": "",
    "personalityStructure": "",
    "behaviorAction": "",
    "innerLoop": "",
    "relationshipPattern": "",
    "pressureDefense": "",
    "deepNeeds": ""
  },
  "agentContext": ""
}

contentJson 正文只能包含 8 个模块：
1. 整体画像概括 -> overall
2. 核心底色 -> coreBase
3. 性格结构 -> personalityStructure
4. 行为与行动模式 -> behaviorAction
5. 内耗循环 -> innerLoop
6. 关系模式 -> relationshipPattern
7. 压力与防御方式 -> pressureDefense
8. 深层敏感点与需求 -> deepNeeds

正文质量要求：
- 8 个模块都必须有内容，且要具体、完整。
- agentContext 必须是可直接复制给其他 AI 的中文段落。
- 每个模块都要体现来自选择路径的依据，但不要写成题号流水账。

AgentContext 必须包含：
- 用户性格/行为倾向
- 容易卡住的地方
- 沟通偏好
- AI 给建议时应避免的方式`;
  }

  private buildSkillSystemPrompt() {
    return `你是 WhoDis 的 Skill.md 生成器。

重要边界：
- 只能根据输入中的 report content、agentContext、tagSummary、moduleCounts 生成 Skill.md。
- 不要新增题目、不要改写业务规则。
- 不要输出 MBTI、人格类型、心理诊断。
- 不要使用空泛鼓励、绝对化判断和病理化表达。

目标：
- 输出一个给其他 AI 使用的长期个人上下文 Skill。
- 它应该比 AgentContext 更完整、更可操作，但不要简单重复报告正文。
- 内容必须具体，能指导其他 AI 如何与这个用户沟通、如何辅助决策、如何在压力状态下提供支持。

必须返回严格 JSON，不要返回 Markdown 包裹，不要解释。

JSON 结构必须是：
{
  "skillMarkdown": ""
}

skillMarkdown 必须是 markdown 文本，并包含以下结构：
# WhoDis Personal Context Skill
## 用户画像摘要
## 核心特征
## 沟通偏好
## 决策与行动支持方式
## 学习与成长支持方式
## 压力状态下的支持方式
## 关系与情绪分析方式
## 需要避免
## 更适合的帮助方式
## 可直接复制给 AI 的使用说明

内容要求：
- 中文。
- 充实、具体、可执行。
- “核心特征”和“更适合的帮助方式”必须使用 bullet。
- “需要避免”至少包含：
  - 空泛鼓励
  - 简单贴标签
  - 制造额外焦虑
  - 直接下诊断
- 不要把内容写成很短的提纲。`;
  }

  private parseAndValidateReport(content: string): LlmReportResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("DeepSeek did not return valid JSON");
    }

    if (!this.isObject(parsed)) {
      throw new Error("DeepSeek JSON is not an object");
    }

    const contentJson = parsed.contentJson;
    if (!this.isObject(contentJson)) {
      throw new Error("DeepSeek JSON missing contentJson");
    }

    for (const key of reportKeys) {
      if (typeof contentJson[key] !== "string" || !contentJson[key].trim()) {
        throw new Error(`DeepSeek JSON missing contentJson.${key}`);
      }
    }

    if (typeof parsed.agentContext !== "string" || !parsed.agentContext.trim()) {
      throw new Error("DeepSeek JSON missing agentContext");
    }

    return {
      contentJson: {
        overall: contentJson.overall,
        coreBase: contentJson.coreBase,
        personalityStructure: contentJson.personalityStructure,
        behaviorAction: contentJson.behaviorAction,
        innerLoop: contentJson.innerLoop,
        relationshipPattern: contentJson.relationshipPattern,
        pressureDefense: contentJson.pressureDefense,
        deepNeeds: contentJson.deepNeeds,
      },
      agentContext: parsed.agentContext,
    };
  }

  private parseAndValidateSkill(content: string): LlmSkillResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("DeepSeek did not return valid JSON");
    }

    if (!this.isObject(parsed)) {
      throw new Error("DeepSeek JSON is not an object");
    }

    if (typeof parsed.skillMarkdown !== "string" || !parsed.skillMarkdown.trim()) {
      throw new Error("DeepSeek JSON missing skillMarkdown");
    }

    return {
      skillMarkdown: parsed.skillMarkdown,
    };
  }

  private isObject(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
