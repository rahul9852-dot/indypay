import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Response } from "express";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { KycSubmissionDto } from "./dto/kyc.dto";
import { DocumentUploadDto } from "./dto/document-upload.dto";
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
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        businessDetails: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.onboardingStatus === ONBOARDING_STATUS.KYC_VERIFIED) {
      throw new Error("User has already completed KYC");
    }

    const { personalInfo, businessStructure, kybInfo, documents } = kycData;

    if (!documents || Object.keys(documents).length === 0) {
      throw new BadRequestException("No documents submitted.");
    }

    if (!kybInfo.directors || kybInfo.directors.length === 0) {
      throw new BadRequestException("At least one director is required.");
    }

    const validDocumentTypes = [
      "panCard",
      "aadharNumber",
      "bankStatement",
      "addressProof",
      "companyPan",
      "companyCheque",
      "moa",
      "aoa",
      "coi",
      "gstinCertificate",
    ];

    const kycDocMedia = Object.entries(documents)
      .filter(([key]) => {
        return validDocumentTypes.includes(key) || key.startsWith("director");
      })
      .map(([key, doc]) => {
        if (!doc?.url || !doc?.docType || !doc?.name) {
          throw new BadRequestException(`Invalid document format for ${key}`);
        }

        return this.userMediaRepository.create({
          documentType: doc.docType,
          documentUrl: doc.url,
          documentName: doc.name,
        });
      });

    const kyc = await this.userKycRepository.save(
      this.userKycRepository.create({
        media: kycDocMedia,
      }),
    );

    const businessDetails = await this.userBusinessRepository.save(
      this.userBusinessRepository.create({
        businessEntityType: businessStructure.typeOfBusiness,
        businessName: businessStructure.businessName,
        businessIndustry: businessStructure.industryName,
        turnover: businessStructure.turnover,
        designation: personalInfo.designation,
        registerBusinessNumber: businessStructure.registeredBusinessNumber,
        businessPan: personalInfo.personalPanNumber,
        websiteUrl: kybInfo.websiteUrl,
        directors: kybInfo.directors,
        moa: documents?.moa?.url,
        aoa: documents?.aoa?.url,
        coi: documents?.coi?.url,
      }),
    );

    businessDetails.user = user;
    await this.userBusinessRepository.save(businessDetails);

    user.businessDetails = businessDetails;
    user.kyc = kyc;
    user.onboardingStatus = ONBOARDING_STATUS.KYC_PENDING;

    const savedUser = await this.userRepository.save(user);

    const payload: IAccessTokenPayload = {
      id: savedUser.id,
      mobile: savedUser.mobile,
      onboardingStatus: savedUser.onboardingStatus,
      role: savedUser.role,
      email: savedUser.email,
    };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await this.cacheManager.del(REDIS_KEYS.USER_KEY(user.id));
    user.onboardingStatus = ONBOARDING_STATUS.KYC_PENDING;
    await this.userRepository.save(user);

    await this.sendKycSubmissionNotification(user.email, user.mobile);

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
            PayBolt
          </div>
          <h2 style="color: #333; text-align: center;">Dear User,</h2>
          <p style="text-align: center;">Your KYC documents have been successfully submitted. Verification is pending!</p>
          <p style="text-align: center;">Thank you for your patience.</p>
          <p style="text-align: center; margin-top: 30px; color: #777;">Regards,<br>PayBolt Support</p>
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
      relations: {
        media: true,
      },
    });

    if (!kyc) {
      throw new NotFoundException("KYC not found");
    }

    return kyc.media;
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
