import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { LlmReportResult, ReportContent } from "./types";

export type LlmAnswerInput = {
  orderNo: number;
  module: string;
  stage: string;
  questionText: string;
  options: Array<{
    id: string;
    text: string;
    tags: string[];
    nextHints: string[];
    selected: boolean;
  }>;
  selectedOptionId: string;
  selectedOptionText: string;
  selectedTags: string[];
};

export type LlmReportInput = {
  answers: LlmAnswerInput[];
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
    const provider = process.env.LLM_PROVIDER;
    if (provider !== "deepseek") {
      throw new BadRequestException("模型调用失败：暂不支持当前 LLM_PROVIDER");
    }

    return this.generateWithDeepSeek(input);
  }

  private async generateWithDeepSeek(input: LlmReportInput): Promise<LlmReportResult> {
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
              content: this.buildSystemPrompt(),
            },
            {
              role: "user",
              content: JSON.stringify(input, null, 2),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 6000,
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

      return this.parseAndValidate(content);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown error";
      throw new InternalServerErrorException(`模型调用失败：${detail}`);
    }
  }

  private buildSystemPrompt() {
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

分析要求：
- 你会收到每题完整 4 个选项，以及用户选中的选项。
- 必须同时参考“用户选择了什么”和“用户没有选择什么”。
- 重点分析选中项和未选项之间的相对差异，例如：用户是在谨慎、敏感、自我承接、目标推进之间选择了哪一种。
- 不要只复述 tags，也不要把 tags 翻译成句子。
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
  "agentContext": "",
  "skillMarkdown": ""
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
- overall 约 180-260 字。
- 其余 7 个正文模块每个约 160-240 字。
- agentContext 约 180-260 字。
- skillMarkdown 要能直接作为一个可复制的个人上下文 skill 使用。
- 每个模块至少包含 2 个来自选择路径的具体依据，但不要列题号流水账。

AgentContext 必须是中文段落，并包含：
- 用户性格/行为倾向
- 容易卡住的地方
- 沟通偏好
- AI 给建议时应避免的方式

Skill.md 必须是 markdown 文本，包含：
# WhoDis Personal Context Skill
## 用户画像摘要
## 沟通偏好
## 决策与行动支持方式
## 压力状态下的支持方式
## 需要避免
- 空泛鼓励
- 简单贴标签
- 制造额外焦虑
- 直接下诊断
## 更适合的帮助方式`;
  }

  private parseAndValidate(content: string): LlmReportResult {
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
    if (typeof parsed.skillMarkdown !== "string" || !parsed.skillMarkdown.trim()) {
      throw new Error("DeepSeek JSON missing skillMarkdown");
    }

    const normalizedContent: ReportContent = {
      overall: contentJson.overall as string,
      coreBase: contentJson.coreBase as string,
      personalityStructure: contentJson.personalityStructure as string,
      behaviorAction: contentJson.behaviorAction as string,
      innerLoop: contentJson.innerLoop as string,
      relationshipPattern: contentJson.relationshipPattern as string,
      pressureDefense: contentJson.pressureDefense as string,
      deepNeeds: contentJson.deepNeeds as string,
    };

    return {
      contentJson: normalizedContent,
      agentContext: parsed.agentContext,
      skillMarkdown: parsed.skillMarkdown,
    };
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
