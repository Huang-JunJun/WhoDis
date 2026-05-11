import { Module } from "@nestjs/common";
import { LlmService } from "./llm.service";
import { PrismaService } from "./prisma.service";
import { ReportService } from "./report.service";
import { SelectionService } from "./selection.service";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";

@Module({
  controllers: [SessionController],
  providers: [LlmService, PrismaService, ReportService, SelectionService, SessionService],
})
export class AppModule {}
