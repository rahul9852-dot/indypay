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
import {
  AadhaarGenerateOtpDto,
  AadhaarVerifyOtpDto,
} from "./verification/dto/aadhaar-verify.dto";
import { GstVerifyDto } from "./verification/dto/gst-verify.dto";
import { BankVerifyDto } from "./verification/dto/bank-verify.dto";
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
@IgnoreBusinessDetails()
@Controller("kyc")
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get("status")
  @ApiOperation({ summary: "Get KYC Status" })
  @ApiOkResponse({ type: KycStatusResDto })
  async getKycStatus(@User() user: IAccessTokenPayload) {
    return this.kycService.getKycStatus(user);
  }

  @Post("submit-full")
  @ApiOperation({
    summary:
      "Submit complete KYC information including personal, business and documents",
  })
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

  // ─── Aadhaar OTP eKYC ────────────────────────────────────────────────────

  @Post("verify/aadhaar/generate-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate Aadhaar OTP via Karza — sends OTP to registered mobile",
  })
  @ApiOkResponse({
    description: "OTP dispatched to Aadhaar-linked mobile",
    schema: {
      example: {
        success: true,
        message: "OTP sent to your Aadhaar-linked mobile number.",
        requestId: "kzra_xxxxxxxxxxxxxxxx",
      },
    },
  })
  async generateAadhaarOtp(
    @User() user: IAccessTokenPayload,
    @Body() dto: AadhaarGenerateOtpDto,
  ) {
    return this.kycService.generateAadhaarOtp(user.id, dto);
  }

  @Post("verify/aadhaar/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify Aadhaar OTP via Karza — returns name, DOB, address",
  })
  @ApiOkResponse({
    description: "Aadhaar verified successfully",
    schema: {
      example: {
        verified: true,
        message: "Aadhaar verified successfully.",
        name: "RAHUL KUMAR",
        dob: "1999-01-31",
        gender: "M",
        mobileLinked: true,
        address: {
          house: "123",
          street: "MG Road",
          district: "Hyderabad",
          state: "Telangana",
          pinCode: "500001",
        },
      },
    },
  })
  async verifyAadhaarOtp(
    @User() user: IAccessTokenPayload,
    @Body() dto: AadhaarVerifyOtpDto,
  ) {
    return this.kycService.verifyAadhaarOtp(user.id, dto);
  }

  // ─── GST Verification ─────────────────────────────────────────────────────

  @Post("verify/gst")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify GSTIN via Karza" })
  @ApiOkResponse({
    description: "GSTIN verified successfully",
    schema: {
      example: {
        verified: true,
        message: "GSTIN verified successfully.",
        gstin: "29AABCT1332L1ZD",
        tradeName: "ABC TRADERS",
        legalName: "ABC PRIVATE LIMITED",
        gstinStatus: "Active",
        registrationDate: "2018-07-01",
        businessType: "Private Limited Company",
        principalPlaceOfBusiness: "Bangalore, Karnataka",
      },
    },
  })
  async verifyGst(
    @User() user: IAccessTokenPayload,
    @Body() dto: GstVerifyDto,
  ) {
    return this.kycService.verifyGst(user.id, dto);
  }

  // ─── Bank Account Verification (Penny Drop) ──────────────────────────────

  @Post("verify/bank")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Verify bank account via penny drop (Karza) — confirms account ownership",
  })
  @ApiOkResponse({
    description: "Bank account verified",
    schema: {
      example: {
        verified: true,
        match: true,
        message: "Bank account verified successfully.",
        beneficiaryName: "RAHUL KUMAR",
        bankTransactionStatus: "SUCCESS",
      },
    },
  })
  async verifyBank(
    @User() user: IAccessTokenPayload,
    @Body() dto: BankVerifyDto,
  ) {
    return this.kycService.verifyBank(user.id, dto);
  }
}
