import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { GeneratePayinReportDto } from "./dto/generate-csv.dto";
import { ReportsService } from "./reports.service";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { USERS_ROLE } from "@/enums";

@ApiTags("Reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}
  @ApiOperation({
    summary: "Generate CSV",
  })
  @Post("payin")
  async generateXLSX(
    @User() user: UsersEntity,
    @Body() generatePayinReportDto: GeneratePayinReportDto,
    @Res() res: Response,
  ) {
    if (user.role !== USERS_ROLE.ADMIN) {
      return this.reportsService.generateXLSX({
        userId: user.id,
        status: generatePayinReportDto.status,
        startDate: generatePayinReportDto.startDate,
        endDate: generatePayinReportDto.endDate,
        res,
      });
    } else {
      if (!generatePayinReportDto.userId) {
        throw new BadRequestException("UserId is required");
      }

      return this.reportsService.generateXLSX({
        userId: generatePayinReportDto.userId,
        startDate: generatePayinReportDto.startDate,
        endDate: generatePayinReportDto.endDate,
        status: generatePayinReportDto.status,
        res,
      });
    }
  }
}
