import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, In, Repository } from "typeorm";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Response } from "express";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { KycSubmissionDto } from "./dto/kyc.dto";
import { DocumentUploadDto } from "./dto/document-upload.dto";
import { PanVerifyDto } from "./verification/dto/pan-verify.dto";
import {
  AadhaarGenerateOtpDto,
  AadhaarVerifyOtpDto,
} from "./verification/dto/aadhaar-verify.dto";
import { GstVerifyDto } from "./verification/dto/gst-verify.dto";
import { BankVerifyDto } from "./verification/dto/bank-verify.dto";
import {
  IKycVerificationProvider,
  KYC_PROVIDER_TOKEN,
} from "./verification/providers/kyc-provider.interface";
import { KycVerificationEntity } from "@/entities/kyc-verification.entity";
import { UsersEntity } from "@/entities/user.entity";
import { UserKycEntity } from "@/entities/user-kyc.entity";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { S3Service } from "@/modules/aws/s3.service";
import { UserMediaEntity } from "@/entities/user-media-kyc.entity";
import { UserBusinessDetailsEntity } from "@/entities/user-business.entity";
import { COOKIE_KEYS, ONBOARDING_STATUS } from "@/enums";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";
import { appConfig } from "@/config/app.config";
import { getOnboardingStatus } from "@/utils/helperFunctions.utils";
import { PaginationDto } from "@/dtos/common.dto";
import { getPagination } from "@/utils/pagination.utils";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { SESService } from "@/modules/aws/ses.service";
import { SNSService } from "@/modules/aws/sns.service";

const PAN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Karza status codes reused across multiple verification types.
const KARZA_AADHAAR_STATUS = { CONSENT_MISSING: 105 } as const;

const {
  jwtConfig: {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
  },
} = appConfig();

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
    @InjectRepository(UserMediaEntity)
    private readonly userMediaRepository: Repository<UserMediaEntity>,
    @InjectRepository(UserBusinessDetailsEntity)
    private readonly userBusinessRepository: Repository<UserBusinessDetailsEntity>,
    @InjectRepository(UserKycEntity)
    private readonly userKycRepository: Repository<UserKycEntity>,
    @InjectRepository(KycVerificationEntity)
    private readonly kycVerificationRepository: Repository<KycVerificationEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(KYC_PROVIDER_TOKEN)
    private readonly kycProvider: IKycVerificationProvider,
    private readonly sesService: SESService,
    private readonly snsService: SNSService,
  ) {}

  async getKycStatus(user: IAccessTokenPayload) {
    const userEntity = await this.userRepository.findOne({
      where: { id: user.id },
      relations: {
        businessDetails: true,
        kyc: true,
      },
    });

    return {
      userId: user.id,
      kycStatus: getOnboardingStatus(userEntity?.onboardingStatus),
      businessDetails: userEntity?.businessDetails,
      kycDetails: userEntity?.kyc,
    };
  }

  async submitFullKyc(
    userId: string,
    kycData: KycSubmissionDto,
    res: Response,
  ) {
    // Load all relations we'll need — done once, before any writes begin.
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { businessDetails: true, kyc: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.onboardingStatus === ONBOARDING_STATUS.KYC_VERIFIED) {
      throw new BadRequestException("KYC has already been verified.");
    }

    const { personalInfo, businessStructure, kybInfo, documents } = kycData;

    // ── Validate documents up-front (fail fast, before any DB write) ─────────
    // Keys must exactly match DocumentsDto property names.
    const VALID_DOC_KEYS = new Set<string>([
      "bankStatement",
      "addressProof",
      "companyPan",
      "companyCheque",
      "moa",
      "aoa",
      "coi",
    ]);

    const kycDocMedia: UserMediaEntity[] = [];
    if (documents) {
      for (const [key, doc] of Object.entries(documents)) {
        if (!VALID_DOC_KEYS.has(key)) continue;
        if (!doc?.url || !doc?.docType || !doc?.name) {
          throw new BadRequestException(
            `Invalid document format for key: ${key}`,
          );
        }
        kycDocMedia.push(
          this.userMediaRepository.create({
            documentType: doc.docType,
            documentUrl: doc.url,
            documentName: doc.name,
          }),
        );
      }
    }

    // ── Build business details payload ────────────────────────────────────────
    // Compute the storable subset first; skip the DB path entirely when nothing
    // maps to a persistable field (e.g. caller only sent personalInfo.email).
    const businessDetailsData: Partial<UserBusinessDetailsEntity> = {
      ...(businessStructure?.typeOfBusiness !== undefined && {
        businessEntityType: businessStructure.typeOfBusiness,
      }),
      ...(businessStructure?.businessName && {
        businessName: businessStructure.businessName,
      }),
      ...(businessStructure?.industryName && {
        businessIndustry: businessStructure.industryName,
      }),
      ...(businessStructure?.turnover !== undefined && {
        turnover: businessStructure.turnover,
      }),
      ...(personalInfo?.designation && {
        designation: personalInfo.designation,
      }),
      ...(businessStructure?.registeredBusinessNumber && {
        registerBusinessNumber: businessStructure.registeredBusinessNumber,
      }),
      ...(personalInfo?.personalPanNumber && {
        businessPan: personalInfo.personalPanNumber,
      }),
      ...(kybInfo?.websiteUrl && { websiteUrl: kybInfo.websiteUrl }),
      ...(kybInfo?.directors?.length && { directors: kybInfo.directors }),
      ...(documents?.moa?.url && { moa: documents.moa.url }),
      ...(documents?.aoa?.url && { aoa: documents.aoa.url }),
      ...(documents?.coi?.url && { coi: documents.coi.url }),
    };
    const hasBusinessData = Object.keys(businessDetailsData).length > 0;

    // ── Single atomic transaction ─────────────────────────────────────────────
    // All DB writes happen together; any failure rolls back completely.
    // We use manager.update() / createQueryBuilder().relation() for the users
    // row instead of manager.save(user) to avoid TypeORM cascading unloaded
    // relations and inadvertently nullifying or duplicating related rows.
    let newKycId: string | null = null;

    await this.dataSource.transaction(async (manager) => {
      // 1. KYC record + media
      if (user.kyc) {
        // Re-submission: replace documents on the existing KYC record so we
        // never create orphaned user_kyc rows.
        if (kycDocMedia.length > 0) {
          await manager.delete(UserMediaEntity, { kyc: { id: user.kyc.id } });
          for (const m of kycDocMedia) {
            m.kyc = user.kyc;
          }
          await manager.save(UserMediaEntity, kycDocMedia);
        }
      } else {
        // First submission: new KYC entity; media cascades via @OneToMany.
        const newKyc = manager.create(UserKycEntity, { media: kycDocMedia });
        const savedKyc = await manager.save(UserKycEntity, newKyc);
        newKycId = savedKyc.id;
      }

      // 2. Business details (upsert)
      if (hasBusinessData) {
        const existing = user.businessDetails;
        if (existing) {
          Object.assign(existing, businessDetailsData);
          await manager.save(UserBusinessDetailsEntity, existing);
        } else {
          const newDetails = manager.create(
            UserBusinessDetailsEntity,
            businessDetailsData,
          );
          const savedDetails = await manager.save(
            UserBusinessDetailsEntity,
            newDetails,
          );
          // FK (businessDetailsId) lives on the users row — set it explicitly.
          await manager
            .createQueryBuilder()
            .relation(UsersEntity, "businessDetails")
            .of(userId)
            .set(savedDetails.id);
        }
      }

      // 3. Stamp onboarding status — plain UPDATE avoids cascade side-effects.
      await manager.update(
        UsersEntity,
        { id: userId },
        {
          onboardingStatus: ONBOARDING_STATUS.KYC_PENDING,
        },
      );

      // 4. Wire the KYC FK only when a new KYC entity was created this request.
      if (newKycId) {
        await manager
          .createQueryBuilder()
          .relation(UsersEntity, "kyc")
          .of(userId)
          .set(newKycId);
      }
    });

    // ── Post-transaction ──────────────────────────────────────────────────────
    await this.cacheManager.del(REDIS_KEYS.USER_KEY(userId));

    const payload: IAccessTokenPayload = {
      id: user.id,
      mobile: user.mobile,
      onboardingStatus: ONBOARDING_STATUS.KYC_PENDING,
      role: user.role,
      email: user.email,
    };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Fire-and-forget: a transient notification failure must never roll back
    // an already-committed KYC submission or block the response.
    // this.sendKycSubmissionNotification(user.email, user.mobile).catch((err) => {
    //   console.error("[KYC] Notification send failed:", err?.message);
    // });

    return res
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .json({ message: "KYC submitted successfully" });
  }

  async sendKycSubmissionNotification(email: string, phoneNumber: string) {
    const emailSubject = "KYC Submission Successful";
    const emailBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #4CAF50;">
            Rupeeflow
          </div>
          <h2 style="color: #333; text-align: center;">Dear User,</h2>
          <p style="text-align: center;">Your KYC documents have been successfully submitted. Verification is pending!</p>
          <p style="text-align: center;">Thank you for your patience.</p>
          <p style="text-align: center; margin-top: 30px; color: #777;">Regards,<br>Rupeeflow Support</p>
        </div>
      </body>
    </html>
`;

    const smsMessage = "KYC successfully submitted, verification pending!";
    await this.sesService.sendEmail(emailSubject, emailBody, email);

    await this.snsService.sendSMS(phoneNumber, smsMessage);
  }

  generateAccessToken(payload: Record<string, any>, options?: JwtSignOptions) {
    return this.jwtService.sign(payload, {
      secret: accessTokenSecret,
      expiresIn: accessTokenExpiresIn,
      ...options,
    });
  }

  generateRefreshToken(payload: Record<string, any>, options?: JwtSignOptions) {
    return this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
      ...options,
    });
  }

  async getDocumentUploadUrl(userId: string, documentInfo: DocumentUploadDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const folderPath = `kyc/${userId}/${documentInfo.documentType}`;
    const { presignedUrl, key } = await this.s3Service.generatePresignedUrl(
      documentInfo.fileName,
      documentInfo.fileType,
      folderPath,
    );

    const fileUrl = this.s3Service.getFileUrl(key);

    return {
      presignedUrl,
      fileUrl,
      documentType: documentInfo.documentType,
      headers: {
        "Content-Type": documentInfo.fileType,
      },
    };
  }

  async getKycDocumentsByUserId(userId: string) {
    const kyc = await this.userKycRepository.findOne({
      where: { user: { id: userId } },
      relations: { media: true },
    });

    // User may not have submitted KYC yet — return empty list, not 404.
    return kyc?.media ?? [];
  }

  async verifyPan(userId: string, dto: PanVerifyDto) {
    const pan = dto.pan.toUpperCase();
    const cacheKey = REDIS_KEYS.KYC_PAN_VERIFIED(pan);

    const cached = await this.cacheManager.get<object>(cacheKey);
    if (cached) return cached;

    let result: Awaited<ReturnType<IKycVerificationProvider["verifyPan"]>>;
    try {
      result = await this.kycProvider.verifyPan({ pan, consent: dto.consent });
    } catch (err: any) {
      await this.writeVerificationAudit({
        userId,
        verificationType: "PAN",
        input: pan,
        verified: false,
        providerRequestId: null,
        providerStatusCode: null,
        rawResponse: { error: err?.message ?? "provider_error" },
      });
      throw new InternalServerErrorException(
        "KYC verification service is temporarily unavailable. Please try again.",
      );
    }

    await this.writeVerificationAudit({
      userId,
      verificationType: "PAN",
      input: pan,
      verified: result.verified,
      providerRequestId: result.providerRequestId,
      providerStatusCode: result.providerStatusCode,
      rawResponse: result.rawResponse,
    });

    if (!result.verified) {
      throw new BadRequestException(
        result.providerStatusCode === 105
          ? "Consent is required for KYC verification."
          : "PAN verification failed. Please check the PAN number and try again.",
      );
    }

    const response = {
      verified: true,
      message: "PAN verified successfully.",
      pan: result.pan,
      name: result.name,
      firstName: result.firstName,
      middleName: result.middleName || null,
      lastName: result.lastName,
      gender: result.gender,
      dob: result.dob,
      mobile: result.mobile || null,
      email: result.email || null,
      panStatus: result.panStatus || null,
      panIssueDate: result.panIssueDate || null,
      fatherName: result.fatherName || null,
      isSoleProprietor: result.isSoleProprietor ?? null,
      isDirector: result.isDirector ?? null,
      isSalaried: result.isSalaried ?? null,
      aadhaarLinked: result.aadhaarLinked ?? null,
      aadhaarMatch: result.aadhaarMatch ?? null,
      address: result.address ?? null,
    };

    await this.cacheManager.set(cacheKey, response, PAN_CACHE_TTL_MS);

    return response;
  }

  private async writeVerificationAudit(data: {
    userId: string;
    verificationType: string;
    input: string;
    verified: boolean;
    providerRequestId: string | null;
    providerStatusCode: number | null;
    rawResponse: Record<string, any>;
  }): Promise<void> {
    try {
      await this.kycVerificationRepository.save(
        this.kycVerificationRepository.create({
          userId: data.userId,
          verificationType: data.verificationType,
          input: data.input,
          provider: "karza",
          providerRequestId: data.providerRequestId,
          providerStatusCode: data.providerStatusCode,
          verified: data.verified,
          responseData: data.rawResponse,
        }),
      );
    } catch (err: any) {
      // Swallow — audit failure must not break the user-facing response.
    }
  }

  // ─── Aadhaar OTP eKYC ────────────────────────────────────────────────────

  async generateAadhaarOtp(userId: string, dto: AadhaarGenerateOtpDto) {
    let result: Awaited<
      ReturnType<IKycVerificationProvider["generateAadhaarOtp"]>
    >;

    try {
      result = await this.kycProvider.generateAadhaarOtp({
        aadhaarNumber: dto.aadhaarNumber,
        consent: dto.consent,
      });
    } catch (err: any) {
      await this.writeVerificationAudit({
        userId,
        verificationType: "AADHAAR_OTP_GENERATE",
        input: `XXXX-XXXX-${dto.aadhaarNumber.slice(-4)}`,
        verified: false,
        providerRequestId: null,
        providerStatusCode: null,
        rawResponse: { error: err?.message ?? "provider_error" },
      });
      throw new InternalServerErrorException(
        "KYC verification service is temporarily unavailable. Please try again.",
      );
    }

    await this.writeVerificationAudit({
      userId,
      verificationType: "AADHAAR_OTP_GENERATE",
      input: `XXXX-XXXX-${dto.aadhaarNumber.slice(-4)}`,
      verified: result.success,
      providerRequestId: result.requestId,
      providerStatusCode: result.providerStatusCode,
      rawResponse: result.rawResponse,
    });

    if (!result.success) {
      throw new BadRequestException(
        result.providerStatusCode === KARZA_AADHAAR_STATUS.CONSENT_MISSING
          ? "Consent is required for Aadhaar OTP generation."
          : "Failed to send OTP. Please check the Aadhaar number and try again.",
      );
    }

    return {
      success: true,
      message: "OTP sent to your Aadhaar-linked mobile number.",
      requestId: result.requestId,
    };
  }

  async verifyAadhaarOtp(userId: string, dto: AadhaarVerifyOtpDto) {
    let result: Awaited<
      ReturnType<IKycVerificationProvider["verifyAadhaarOtp"]>
    >;

    try {
      result = await this.kycProvider.verifyAadhaarOtp({
        otp: dto.otp,
        requestId: dto.requestId,
      });
    } catch (err: any) {
      await this.writeVerificationAudit({
        userId,
        verificationType: "AADHAAR_OTP_VERIFY",
        input: dto.requestId,
        verified: false,
        providerRequestId: null,
        providerStatusCode: null,
        rawResponse: { error: err?.message ?? "provider_error" },
      });
      throw new InternalServerErrorException(
        "KYC verification service is temporarily unavailable. Please try again.",
      );
    }

    await this.writeVerificationAudit({
      userId,
      verificationType: "AADHAAR_OTP_VERIFY",
      input: dto.requestId,
      verified: result.verified,
      providerRequestId: result.providerRequestId,
      providerStatusCode: result.providerStatusCode,
      rawResponse: result.rawResponse,
    });

    if (!result.verified) {
      throw new BadRequestException(
        "Aadhaar OTP verification failed. Please check the OTP and try again.",
      );
    }

    return {
      verified: true,
      message: "Aadhaar verified successfully.",
      name: result.name,
      dob: result.dob,
      gender: result.gender,
      mobileLinked: result.mobileLinked ?? null,
      address: result.address ?? null,
    };
  }

  // ─── GST Verification ─────────────────────────────────────────────────────

  async verifyGst(userId: string, dto: GstVerifyDto) {
    const gstin = dto.gstin.toUpperCase();
    const cacheKey = REDIS_KEYS.KYC_GST_VERIFIED(gstin);

    const cached = await this.cacheManager.get<object>(cacheKey);
    if (cached) return cached;

    let result: Awaited<ReturnType<IKycVerificationProvider["verifyGst"]>>;

    try {
      result = await this.kycProvider.verifyGst({
        gstin,
        consent: dto.consent,
      });
    } catch (err: any) {
      await this.writeVerificationAudit({
        userId,
        verificationType: "GST",
        input: gstin,
        verified: false,
        providerRequestId: null,
        providerStatusCode: null,
        rawResponse: { error: err?.message ?? "provider_error" },
      });
      throw new InternalServerErrorException(
        "KYC verification service is temporarily unavailable. Please try again.",
      );
    }

    await this.writeVerificationAudit({
      userId,
      verificationType: "GST",
      input: gstin,
      verified: result.verified,
      providerRequestId: result.providerRequestId,
      providerStatusCode: result.providerStatusCode,
      rawResponse: result.rawResponse,
    });

    if (!result.verified) {
      throw new BadRequestException(
        result.providerStatusCode === 105
          ? "Consent is required for GST verification."
          : "GST verification failed. Please check the GSTIN and try again.",
      );
    }

    const response = {
      verified: true,
      message: "GSTIN verified successfully.",
      gstin: result.gstin,
      tradeName: result.tradeName,
      legalName: result.legalName,
      gstinStatus: result.gstinStatus,
      registrationDate: result.registrationDate,
      businessType: result.businessType,
      principalPlaceOfBusiness: result.principalPlaceOfBusiness ?? null,
    };

    await this.cacheManager.set(cacheKey, response, PAN_CACHE_TTL_MS);

    return response;
  }

  // ─── Bank Account Verification (Penny Drop) ──────────────────────────────

  async verifyBank(userId: string, dto: BankVerifyDto) {
    const cacheKey = REDIS_KEYS.KYC_BANK_VERIFIED(dto.accountNumber, dto.ifsc);

    const cached = await this.cacheManager.get<object>(cacheKey);
    if (cached) return cached;

    let result: Awaited<ReturnType<IKycVerificationProvider["verifyBank"]>>;

    try {
      result = await this.kycProvider.verifyBank({
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc.toUpperCase(),
        consent: dto.consent,
      });
    } catch (err: any) {
      await this.writeVerificationAudit({
        userId,
        verificationType: "BANK",
        input: `XXXX${dto.accountNumber.slice(-4)}:${dto.ifsc}`,
        verified: false,
        providerRequestId: null,
        providerStatusCode: null,
        rawResponse: { error: err?.message ?? "provider_error" },
      });
      throw new InternalServerErrorException(
        "KYC verification service is temporarily unavailable. Please try again.",
      );
    }

    await this.writeVerificationAudit({
      userId,
      verificationType: "BANK",
      input: `XXXX${dto.accountNumber.slice(-4)}:${dto.ifsc}`,
      verified: result.verified,
      providerRequestId: result.providerRequestId,
      providerStatusCode: result.providerStatusCode,
      rawResponse: result.rawResponse,
    });

    if (!result.verified) {
      throw new BadRequestException(
        "Bank account verification failed. Please check the account number and IFSC.",
      );
    }

    const response = {
      verified: true,
      match: result.match,
      message: result.match
        ? "Bank account verified successfully."
        : "Bank account found but name does not match KYC records.",
      beneficiaryName: result.beneficiaryName ?? null,
      bankTransactionStatus: result.bankTransactionStatus ?? null,
    };

    await this.cacheManager.set(cacheKey, response, PAN_CACHE_TTL_MS);

    return response;
  }

  async getPendingKycUsers({
    page = 1,
    limit = 10,
    search = "",
    sort = "id",
    order = "DESC",
  }: PaginationDto) {
    const [users, totalItems] = await this.userRepository.findAndCount({
      where: {
        ...(search && { fullName: ILike(`%${search}%`) }),
        onboardingStatus: In([
          ONBOARDING_STATUS.KYC_PENDING,
          ONBOARDING_STATUS.SIGN_UP,
          ONBOARDING_STATUS.KYC_REJECTED,
          ONBOARDING_STATUS.KYC_ON_HOLD,
        ]),
      },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
    });

    const pagination = getPagination({
      totalItems,
      limit,
      page,
    });

    return {
      data: users,
      pagination,
    };
  }
}
