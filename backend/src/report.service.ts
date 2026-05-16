import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Report } from "@prisma/client";
import { LlmService } from "./llm.service";
import { PrismaService } from "./prisma.service";
import { SelectionService } from "./selection.service";
import { ReportContent, ReportResponse } from "./types";

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

  async createReport(sessionId: string): Promise<ReportResponse> {
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
      return this.toReportResponse(session.report);
    }

    if (!this.selectionService.canGenerateReport(session.answers)) {
      throw new BadRequestException("必须完整完成 30 道题后才能生成报告");
    }

    const generationStartedAt = Date.now();
    const llmReport = await this.llmService.generateReport(this.buildLlmInput(session.answers));
    const generationDurationMs = Date.now() - generationStartedAt;

    const report = await this.prisma.report.create({
      data: {
        sessionId,
        title: "WhoDis 个人画像报告",
        contentJson: llmReport.contentJson as unknown as Prisma.InputJsonValue,
        agentContext: llmReport.agentContext,
        skillMarkdown: llmReport.skillMarkdown,
        generationDurationMs,
      },
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        canGenerateReport: true,
      },
    });

    return this.toReportResponse(report);
  }

  async getReport(sessionId: string): Promise<ReportResponse> {
    const report = await this.prisma.report.findUnique({ where: { sessionId } });
    if (!report) {
      throw new NotFoundException("Report not found");
    }
    return this.toReportResponse(report);
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

  private toReportResponse(report: Report): ReportResponse {
    return {
      id: report.id,
      sessionId: report.sessionId,
      title: report.title,
      contentJson: this.asReportContent(report.contentJson),
      agentContext: report.agentContext,
      skillMarkdown: report.skillMarkdown,
      generationDurationMs: report.generationDurationMs,
      createdAt: report.createdAt,
    };
  }

  private asReportContent(value: Prisma.JsonValue): ReportContent {
    return {
      overall: this.readStringField(value, "overall"),
      coreBase: this.readStringField(value, "coreBase"),
      personalityStructure: this.readStringField(value, "personalityStructure"),
      behaviorAction: this.readStringField(value, "behaviorAction"),
      innerLoop: this.readStringField(value, "innerLoop"),
      relationshipPattern: this.readStringField(value, "relationshipPattern"),
      pressureDefense: this.readStringField(value, "pressureDefense"),
      deepNeeds: this.readStringField(value, "deepNeeds"),
    };
  }
}
