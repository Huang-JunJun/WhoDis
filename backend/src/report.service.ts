import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { SelectionService } from "./selection.service";
import { ReportContent } from "./types";

type AnswerForReport = {
  selectedOptionText: string;
  selectedTags: Prisma.JsonValue;
  question: {
    module: string;
    questionText: string;
  };
};

const moduleText: Record<keyof ReportContent, { title: string; module?: string }> = {
  overall: { title: "整体画像概括" },
  coreBase: { title: "核心底色", module: "core_base" },
  personalityStructure: { title: "性格结构", module: "personality_structure" },
  behaviorAction: { title: "行为与行动模式", module: "behavior_action" },
  innerLoop: { title: "内耗循环", module: "inner_loop" },
  relationshipPattern: { title: "关系模式", module: "relationship_pattern" },
  pressureDefense: { title: "压力与防御方式", module: "pressure_defense" },
  deepNeeds: { title: "深层敏感点与需求", module: "deep_needs" },
};

const tagDescriptions: Record<string, string> = {
  overthinking: "在行动前会进行较多推演",
  cautious_decision: "决策谨慎，重视充分判断",
  risk_aware: "对风险和后果较敏感",
  sensitive: "感受细腻，容易捕捉氛围变化",
  observant: "观察力强，会先读环境",
  emotion_aware: "能识别自己和他人的情绪信号",
  self_contained: "习惯先自己承接和消化压力",
  hidden_pressure: "外表稳定，但内部压力不一定外显",
  low_expression: "表达克制，不会轻易摊开内心活动",
  growth_oriented: "重视成长和持续推进",
  self_demanding: "对自己有较高要求",
  achievement_need: "需要通过进展和结果获得确定感",
  boundary_need: "在人际中需要清晰边界",
  clarity_need: "需要问题被说清楚、结构化",
  validation_need: "希望复杂感受被理解而不是评价",
  control_need: "在可控结构中更容易稳定",
  perfectionism: "容易在细节和完成度上持续打磨",
  self_blame: "遇到问题时容易先回到自我归因",
  low_pressure_support: "更适合低压、不过度催促的支持方式",
  needs_next_step: "需要具体且可执行的下一步",
  needs_problem_framing: "适合先拆分问题类型再行动",
  avoid_extra_anxiety: "不适合被放大风险或焦虑",
  avoid_labeling: "不适合被简单归类或贴固定标签",
};

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selectionService: SelectionService,
  ) {}

  async createReport(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: { question: true },
          orderBy: { createdAt: "asc" },
        },
        report: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    if (session.report) {
      return session.report;
    }

    if (!this.selectionService.canGenerateReport(session.answers)) {
      throw new BadRequestException("至少完成 15 道题且覆盖核心模块后才能生成报告");
    }

    const contentJson = this.buildContent(session.answers);
    const agentContext = this.buildAgentContext(session.answers);
    const skillMarkdown = this.buildSkillMarkdown(contentJson, agentContext);

    const report = await this.prisma.report.create({
      data: {
        sessionId,
        title: "WhoDis 个人画像报告",
        contentJson: contentJson as unknown as Prisma.InputJsonValue,
        agentContext,
        skillMarkdown,
      },
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        canGenerateReport: true,
      },
    });

    return report;
  }

  async getReport(sessionId: string) {
    const report = await this.prisma.report.findUnique({ where: { sessionId } });
    if (!report) {
      throw new NotFoundException("Report not found");
    }
    return report;
  }

  private buildContent(answers: AnswerForReport[]): ReportContent {
    const dominant = this.getDominantTagDescriptions(answers, 7);

    return {
      overall: `你在本次访谈中呈现出一种以清晰、稳定和自我校准为核心的行动方式。${dominant.slice(0, 3).join("，")}。整体来看，你并不适合被简单归类，更适合用具体情境、压力来源和行动支持方式来理解。`,
      coreBase: this.moduleParagraph(answers, "core_base", "你的核心底色围绕“稳定感、清晰感和自主节奏”展开。你更容易在目标明确、边界清楚、节奏可控的环境中发挥稳定能力。"),
      personalityStructure: this.moduleParagraph(answers, "personality_structure", "你的性格结构偏向先观察、再判断、再行动。你会保留对复杂性的敏感，不倾向于用单一结论处理自己或他人。"),
      behaviorAction: this.moduleParagraph(answers, "behavior_action", "你的行动模式需要明确入口和可执行路径。相比被催促，你更适合先拆解问题、确认优先级，再用一个小步骤启动。"),
      innerLoop: this.moduleParagraph(answers, "inner_loop", "你的内耗往往来自不确定、责任边界不清或完成标准过高。有效的退出方式不是空泛鼓励，而是把事实、感受、推测和下一步分开。"),
      relationshipPattern: this.moduleParagraph(answers, "relationship_pattern", "你的关系模式重视真实、边界和稳定一致。你不一定快速外露需求，但会持续观察沟通是否可靠、是否尊重复杂感受。"),
      pressureDefense: this.moduleParagraph(answers, "pressure_defense", "压力状态下，你可能会先收缩表达、恢复判断或寻找可控点。这不是逃避，而是一种降低变量、重新组织信息的防御方式。"),
      deepNeeds: this.moduleParagraph(answers, "deep_needs", "你的深层需求集中在被准确理解、拥有清晰结构、保留自主节奏。对你有效的支持应减少猜测和压迫，提供可落地的判断框架。"),
    };
  }

  private buildAgentContext(answers: AnswerForReport[]) {
    const descriptions = this.getDominantTagDescriptions(answers, 8);
    return `该用户的性格和行为倾向包括：${descriptions.join("，")}。用户容易卡在信息不完整、责任边界不清、关系信号模糊或自我要求过高的情境中。与该用户沟通时，建议先区分现实问题、情绪问题和行动问题，再给出具体、可执行、低压的下一步。AI 给建议时应避免空泛鼓励、简单贴标签、制造额外焦虑、直接下诊断或把复杂状态简化成固定人格结论。`;
  }

  private buildSkillMarkdown(content: ReportContent, agentContext: string) {
    return `# WhoDis Personal Context Skill

## 用户画像摘要
${content.overall}

## 沟通偏好
适合清晰、具体、尊重复杂性的沟通方式。先确认事实与情绪，再提出建议。不要急着评价或归类。

## 决策与行动支持方式
${content.behaviorAction}

## 压力状态下的支持方式
${content.pressureDefense}

## 需要避免
- 空泛鼓励
- 简单贴标签
- 制造额外焦虑
- 直接下诊断

## 更适合的帮助方式
${agentContext}
`;
  }

  private moduleParagraph(answers: AnswerForReport[], module: string, fallback: string) {
    const selected = answers.filter((answer) => answer.question.module === module).map((answer) => answer.selectedOptionText);
    if (selected.length === 0) {
      return fallback;
    }
    return `${fallback} 本次路径中，你选择了「${selected.slice(0, 3).join("」「")}」，这些选择显示该模块更需要被放在真实情境中理解，而不是被抽象定性。`;
  }

  private getDominantTagDescriptions(answers: AnswerForReport[], limit: number) {
    const counts = new Map<string, number>();
    for (const answer of answers) {
      for (const tag of this.asStringArray(answer.selectedTags)) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    const descriptions = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([tag]) => tagDescriptions[tag])
      .filter((description): description is string => Boolean(description))
      .slice(0, limit);

    return descriptions.length > 0 ? descriptions : ["重视清晰表达", "需要具体支持", "倾向在行动前整理判断"];
  }

  private asStringArray(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }
}
