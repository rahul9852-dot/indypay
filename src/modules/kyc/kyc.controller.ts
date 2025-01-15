import { Controller, Get, Post, Body, Res, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { KycService } from "./kyc.service";
import { KycStatusResDto } from "./dto/kyc-status.dto";
import { DocumentUploadDto } from "./dto/document-upload.dto";
import { KycSubmissionDto } from "./dto/kyc.dto";
import { User } from "@/decorators/user.decorator";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";

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
}
