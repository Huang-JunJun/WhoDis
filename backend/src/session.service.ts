import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { firstQuestion, questionBank } from "./question-bank";
import { PrismaService } from "./prisma.service";
import { SelectionService } from "./selection.service";
import { OptionId, QuestionItem } from "./types";

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selectionService: SelectionService,
  ) {}

  async createSession() {
    const session = await this.prisma.session.create({ data: {} });
    const question = await this.createSessionQuestion(session.id, firstQuestion, 1);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { currentQuestionId: question.id },
    });

    return this.getSession(session.id);
  }

  async getSession(id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException("Session not found");
    }

    const currentQuestion = session.currentQuestionId
      ? await this.prisma.question.findUnique({ where: { id: session.currentQuestionId } })
      : null;

    return {
      id: session.id,
      status: session.status,
      questionCount: session.questionCount,
      canGenerateReport: session.canGenerateReport,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            bankQuestionId: currentQuestion.bankQuestionId,
            module: currentQuestion.module,
            stage: currentQuestion.stage,
            question: currentQuestion.questionText,
            options: currentQuestion.optionsJson,
          }
        : null,
    };
  }

  async answerQuestion(sessionId: string, selectedOptionId: OptionId) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException("Session not found");
    }
    if (!session.currentQuestionId) {
      throw new BadRequestException("当前 session 没有可回答的问题");
    }
    if (session.status !== "interviewing") {
      throw new BadRequestException("当前 session 已不在访谈状态");
    }

    const question = await this.prisma.question.findUnique({ where: { id: session.currentQuestionId } });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const bankQuestion = questionBank.find((item) => item.id === question.bankQuestionId);
    const selectedOption = bankQuestion?.options.find((item) => item.id === selectedOptionId);
    if (!bankQuestion || !selectedOption) {
      throw new BadRequestException("无效的选项");
    }

    await this.prisma.answer.create({
      data: {
        sessionId,
        questionId: question.id,
        selectedOptionId,
        selectedOptionText: selectedOption.text,
        selectedTags: selectedOption.tags as Prisma.InputJsonValue,
        nextHints: selectedOption.nextHints as Prisma.InputJsonValue,
      },
    });

    const answers = await this.prisma.answer.findMany({
      where: { sessionId },
      include: { question: true },
      orderBy: { createdAt: "asc" },
    });
    const selection = this.selectionService.selectNextQuestion(answers);

    if (selection.canGenerateReport) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "ready_to_report",
          currentQuestionId: null,
          questionCount: answers.length,
          canGenerateReport: true,
        },
      });
      return this.getSession(sessionId);
    }

    const nextQuestion = await this.createSessionQuestion(sessionId, selection.nextQuestion, answers.length + 1);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        currentQuestionId: nextQuestion.id,
        questionCount: answers.length,
        canGenerateReport: false,
      },
    });

    return this.getSession(sessionId);
  }

  private createSessionQuestion(sessionId: string, question: QuestionItem, orderNo: number) {
    return this.prisma.question.create({
      data: {
        sessionId,
        bankQuestionId: question.id,
        module: question.module,
        stage: question.stage,
        questionText: question.question,
        optionsJson: question.options as unknown as Prisma.InputJsonValue,
        orderNo,
      },
    });
  }
}
