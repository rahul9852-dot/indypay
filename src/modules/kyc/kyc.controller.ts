import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { KycService } from "./kyc.service";
import { PanVerifyDto } from "./verification/dto/pan-verify.dto";
import { KycStatusResDto } from "./dto/kyc-status.dto";
import { DocumentUploadDto } from "./dto/document-upload.dto";
import { KycSubmissionDto } from "./dto/kyc.dto";
import { User } from "@/decorators/user.decorator";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PaginationDto } from "@/dtos/common.dto";

@ApiTags("KYC")
@IgnoreKyc()
@Controller("kyc")
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get("status")
  @ApiOperation({ summary: "Get KYC Status" })
  @ApiOkResponse({ type: KycStatusResDto })
  @IgnoreKyc()
  async getKycStatus(@User() user: IAccessTokenPayload) {
    return this.kycService.getKycStatus(user);
  }

  @Post("submit-full")
  @ApiOperation({
    summary:
      "Submit complete KYC information including personal, business and documents",
  })
  @IgnoreKyc()
  async submitFullKyc(
    @User() user: UsersEntity,
    @Body() kycData: KycSubmissionDto,
    @Res() res: Response,
  ) {
    return this.kycService.submitFullKyc(user.id, kycData, res);
  }

  @Post("document/presigned-url")
  @ApiOperation({ summary: "Get presigned URL for document upload" })
  async getDocumentUploadUrl(
    @User() user: UsersEntity,
    @Body() documentInfo: DocumentUploadDto,
  ) {
    return this.kycService.getDocumentUploadUrl(user.id, documentInfo);
  }

  @Get("documents")
  @Role(USERS_ROLE.MERCHANT)
  @ApiOperation({ summary: "Get KYC Documents" })
  @ApiOkResponse({ type: DocumentUploadDto, isArray: true })
  @IgnoreKyc()
  async getKycDocuments(@User() user: IAccessTokenPayload) {
    return this.kycService.getKycDocumentsByUserId(user.id);
  }

  @Get("documents/:userId")
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get KYC Documents by user - Admin" })
  @ApiOkResponse({ type: DocumentUploadDto, isArray: true })
  @IgnoreKyc()
  async getKycDocumentsByUserId(@Param("userId") userId: string) {
    return this.kycService.getKycDocumentsByUserId(userId);
  }

  @Get("pending")
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({ summary: "Get KYC pending users - Admin" })
  @ApiOkResponse({ type: UsersEntity, isArray: true })
  @IgnoreKyc()
  async getPendingKycUsers(@Query() query: PaginationDto) {
    return this.kycService.getPendingKycUsers(query);
  }

  @Post("verify/pan")
  @HttpCode(HttpStatus.OK)
  @IgnoreBusinessDetails()
  @ApiOperation({ summary: "Verify PAN card via Karza" })
  @ApiOkResponse({
    description: "PAN verified successfully",
    schema: {
      example: {
        verified: true,
        name: "RAHUL KUMAR",
        dob: "1999-01-31",
        gender: "male",
        aadhaarLinked: true,
        message: "PAN verified successfully.",
      },
    },
  })
  async verifyPan(
    @User() user: IAccessTokenPayload,
    @Body() dto: PanVerifyDto,
  ) {
    return this.kycService.verifyPan(user.id, dto);
  }
}
