import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { ReportService } from "./report.service";
import { SelectionService } from "./selection.service";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";

@Module({
  controllers: [SessionController],
  providers: [PrismaService, ReportService, SelectionService, SessionService],
})
export class AppModule {}
