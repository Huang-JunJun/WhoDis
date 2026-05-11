import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ReportService } from "./report.service";
import { SessionService } from "./session.service";
import { OptionId } from "./types";

@Controller("api/session")
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly reportService: ReportService,
  ) {}

  @Post("create")
  createSession() {
    return this.sessionService.createSession();
  }

  @Get(":id")
  getSession(@Param("id") id: string) {
    return this.sessionService.getSession(id);
  }

  @Post(":id/answer")
  answerQuestion(@Param("id") id: string, @Body("selectedOptionId") selectedOptionId: OptionId) {
    return this.sessionService.answerQuestion(id, selectedOptionId);
  }

  @Post(":id/report")
  createReport(@Param("id") id: string) {
    return this.reportService.createReport(id);
  }

  @Get(":id/report")
  getReport(@Param("id") id: string) {
    return this.reportService.getReport(id);
  }
}
