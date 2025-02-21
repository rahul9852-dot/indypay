import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { GenerateReportDto } from "./dto/generate-csv.dto";
import { ReportsService } from "./reports.service";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { USERS_ROLE } from "@/enums";

@ApiTags("Reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({
    summary: "Generate XLSX Payin",
  })
  @Post("payin")
  async generateXLSXPayin(
    @User() user: UsersEntity,
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    if (![USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      return this.reportsService.generateXLSXPayin({
        userId: user.id,
        status: generateReportDto.status,
        startDate: generateReportDto.startDate,
        endDate: generateReportDto.endDate,
        from: generateReportDto.from,
        count: generateReportDto.count,
        res,
      });
    } else {
      if (!generateReportDto.userId) {
        throw new BadRequestException("UserId is required");
      }

      return this.reportsService.generateXLSXPayin({
        userId: generateReportDto.userId,
        startDate: generateReportDto.startDate,
        endDate: generateReportDto.endDate,
        status: generateReportDto.status,
        from: generateReportDto.from,
        count: generateReportDto.count,
        res,
      });
    }
  }

  @ApiOperation({
    summary: "Generate XLSX Payout",
  })
  @Post("payout")
  async generateXLSXPayout(
    @User() user: UsersEntity,
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    if (![USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      return this.reportsService.generateXLSXPayout({
        userId: user.id,
        status: generateReportDto.status,
        startDate: generateReportDto.startDate,
        endDate: generateReportDto.endDate,
        from: generateReportDto.from,
        count: generateReportDto.count,
        res,
      });
    } else {
      if (!generateReportDto.userId) {
        throw new BadRequestException("UserId is required");
      }

      return this.reportsService.generateXLSXPayout({
        userId: generateReportDto.userId,
        startDate: generateReportDto.startDate,
        endDate: generateReportDto.endDate,
        status: generateReportDto.status,
        from: generateReportDto.from,
        count: generateReportDto.count,
        res,
      });
    }
  }
}
