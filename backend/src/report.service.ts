import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { LlmService } from "./llm.service";
import { PrismaService } from "./prisma.service";
import { SelectionService } from "./selection.service";

type AnswerForReport = {
  selectedOptionId: string;
  selectedOptionText: string;
  selectedTags: Prisma.JsonValue;
  question: {
    module: string;
    stage: string;
    questionText: string;
    optionsJson: Prisma.JsonValue;
  };
};

@Injectable()
export class ReportService {
  constructor(
    @Inject(LlmService)
    private readonly llmService: LlmService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SelectionService)
    private readonly selectionService: SelectionService,
  ) {}

  async createReport(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: { question: true },
          orderBy: { question: { orderNo: "asc" } },
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
      throw new BadRequestException("必须完整完成 30 道题后才能生成报告");
    }

    const llmReport = await this.llmService.generateReport(this.buildLlmInput(session.answers));

    const report = await this.prisma.report.create({
      data: {
        sessionId,
        title: "WhoDis 个人画像报告",
        contentJson: llmReport.contentJson as unknown as Prisma.InputJsonValue,
        agentContext: llmReport.agentContext,
        skillMarkdown: llmReport.skillMarkdown,
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

  private buildLlmInput(answers: AnswerForReport[]) {
    const tagSummary = new Map<string, number>();
    const moduleCounts = new Map<string, number>();
    for (const answer of answers) {
      moduleCounts.set(answer.question.module, (moduleCounts.get(answer.question.module) ?? 0) + 1);
      for (const tag of this.asStringArray(answer.selectedTags)) {
        tagSummary.set(tag, (tagSummary.get(tag) ?? 0) + 1);
      }
    }

    return {
      answers: answers.map((answer, index) => ({
        orderNo: index + 1,
        module: answer.question.module,
        stage: answer.question.stage,
        questionText: answer.question.questionText,
        options: this.asOptionArray(answer.question.optionsJson).map((option) => ({
          ...option,
          selected: option.id === answer.selectedOptionId,
        })),
        selectedOptionId: answer.selectedOptionId,
        selectedOptionText: answer.selectedOptionText,
        selectedTags: this.asStringArray(answer.selectedTags),
      })),
      tagSummary: Object.fromEntries(tagSummary.entries()),
      moduleCounts: Object.fromEntries(moduleCounts.entries()),
    };
  }

  private asStringArray(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }

  private asOptionArray(value: Prisma.JsonValue) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => ({
        id: this.readStringField(item, "id"),
        text: this.readStringField(item, "text"),
        tags: this.asStringArray(this.readJsonField(item, "tags")),
        nextHints: this.asStringArray(this.readJsonField(item, "nextHints")),
      }))
      .filter((item) => item.id && item.text);
  }

  private readStringField(value: Prisma.JsonValue, key: string) {
    const field = this.readJsonField(value, key);
    return typeof field === "string" ? field : "";
  }

  private readJsonField(value: Prisma.JsonValue, key: string): Prisma.JsonValue {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }
    const field = value[key];
    return field === undefined ? null : field;
  }
}
