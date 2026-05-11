import { Injectable } from "@nestjs/common";
import { QuestionItem, QuestionModule } from "./types";
import { moduleMinimums, questionBank } from "./question-bank";

type AnswerSnapshot = {
  question: {
    bankQuestionId: string;
    module: string;
  };
  nextHints: unknown;
};

type SelectionResult =
  | {
      canGenerateReport: true;
      nextQuestion: null;
    }
  | {
      canGenerateReport: false;
      nextQuestion: QuestionItem;
    };

const phasedModules: QuestionModule[][] = [
  ["personality_structure", "behavior_action"],
  ["relationship_pattern", "pressure_defense"],
  ["core_base", "inner_loop", "deep_needs"],
];

@Injectable()
export class SelectionService {
  selectNextQuestion(answers: AnswerSnapshot[]): SelectionResult {
    const questionCount = answers.length;
    const moduleCounts = this.getModuleCounts(answers);
    const missingModules = this.getMissingModules(moduleCounts);

    if (questionCount >= 30) {
      return { canGenerateReport: true, nextQuestion: null };
    }

    const answeredBankIds = new Set(answers.map((answer) => answer.question.bankQuestionId));
    const unasked = questionBank.filter((question) => !answeredBankIds.has(question.id));

    if (unasked.length === 0) {
      return { canGenerateReport: true, nextQuestion: null };
    }

    const recentHints = this.asModuleArray(answers.at(-1)?.nextHints);
    const hinted = unasked.filter(
      (question) =>
        recentHints.includes(question.module) &&
        (moduleMinimums[question.module as Exclude<QuestionModule, "overall">] ?? 0) >
          (moduleCounts[question.module] ?? 0),
    );

    if (hinted.length > 0) {
      return { canGenerateReport: false, nextQuestion: this.pickBest(hinted, questionCount + 1, recentHints, missingModules) };
    }

    if (questionCount >= 15 && missingModules.length > 0) {
      const missing = unasked.filter((question) => missingModules.includes(question.module));
      if (missing.length > 0) {
        return { canGenerateReport: false, nextQuestion: this.pickBest(missing, questionCount + 1, recentHints, missingModules) };
      }
    }

    const phaseModules = this.getPhaseModules(questionCount + 1);
    const phaseCandidates = unasked.filter((question) => phaseModules.includes(question.module));

    if (phaseCandidates.length > 0) {
      return { canGenerateReport: false, nextQuestion: this.pickBest(phaseCandidates, questionCount + 1, recentHints, missingModules) };
    }

    return { canGenerateReport: false, nextQuestion: this.pickBest(unasked, questionCount + 1, recentHints, missingModules) };
  }

  canGenerateReport(answers: AnswerSnapshot[]) {
    const questionCount = answers.length;
    return questionCount >= 30;
  }

  getModuleCounts(answers: AnswerSnapshot[]) {
    return answers.reduce<Record<string, number>>((counts, answer) => {
      counts[answer.question.module] = (counts[answer.question.module] ?? 0) + 1;
      return counts;
    }, {});
  }

  getMissingModules(moduleCounts: Record<string, number>) {
    return Object.entries(moduleMinimums)
      .filter(([module, minimum]) => (moduleCounts[module] ?? 0) < minimum)
      .map(([module]) => module as QuestionModule);
  }

  private getPhaseModules(nextOrderNo: number) {
    if (nextOrderNo <= 5) {
      return phasedModules[0];
    }
    if (nextOrderNo <= 10) {
      return phasedModules[1];
    }
    if (nextOrderNo <= 15) {
      return phasedModules[2];
    }
    return [...phasedModules[0], ...phasedModules[1], ...phasedModules[2]];
  }

  private pickBest(
    candidates: QuestionItem[],
    nextOrderNo: number,
    recentHints: QuestionModule[],
    missingModules: QuestionModule[],
  ) {
    const phaseModules = this.getPhaseModules(nextOrderNo);
    const stageScore: Record<QuestionItem["stage"], number> = {
      early: nextOrderNo <= 5 ? 8 : 0,
      middle: nextOrderNo > 5 && nextOrderNo <= 12 ? 8 : 2,
      deep: nextOrderNo > 10 ? 8 : 1,
      closing: nextOrderNo > 14 ? 6 : 0,
    };

    return [...candidates].sort((left, right) => {
      const leftScore = this.score(left, phaseModules, recentHints, missingModules, stageScore);
      const rightScore = this.score(right, phaseModules, recentHints, missingModules, stageScore);
      return rightScore - leftScore || questionBank.indexOf(left) - questionBank.indexOf(right);
    })[0];
  }

  private score(
    question: QuestionItem,
    phaseModules: QuestionModule[],
    recentHints: QuestionModule[],
    missingModules: QuestionModule[],
    stageScore: Record<QuestionItem["stage"], number>,
  ) {
    return (
      (recentHints.includes(question.module) ? 50 : 0) +
      (missingModules.includes(question.module) ? 35 : 0) +
      (phaseModules.includes(question.module) ? 25 : 0) +
      stageScore[question.stage]
    );
  }

  private asModuleArray(value: unknown): QuestionModule[] {
    return Array.isArray(value) ? value.filter((item): item is QuestionModule => typeof item === "string") : [];
  }
}
