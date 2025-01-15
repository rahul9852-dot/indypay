import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Response } from "express";
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
      throw new Error("User has already completed kyc");
    }

    const { personalInfo, businessStructure, documents } = kycData;

    const aadharId = this.userMediaRepository.create({
      documentType: documents.aadharNumber.docType,
      documentUrl: documents.aadharNumber.url,
      documentName: documents.aadharNumber.name,
    });

    const panId = this.userMediaRepository.create({
      documentType: documents.panCard.docType,
      documentUrl: documents.panCard.url,
      documentName: documents.panCard.name,
    });

    const addressProofId = this.userMediaRepository.create({
      documentType: documents.addressProof.docType,
      documentUrl: documents.addressProof.url,
      documentName: documents.addressProof.name,
    });

    const bankStatementId = this.userMediaRepository.create({
      documentType: documents.bankStatement.docType,
      documentUrl: documents.bankStatement.url,
      documentName: documents.bankStatement.name,
    });

    const kycDocMedia = await Promise.all([
      panId,
      aadharId,
      addressProofId,
      bankStatementId,
    ]);

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
      }),
    );

    const savedUser = await this.userRepository.save(
      this.userRepository.create({
        id: userId,
        onboardingStatus: ONBOARDING_STATUS.KYC_PENDING,
        kyc,
        businessDetails,
      }),
    );

    const payload: IAccessTokenPayload = {
      id: savedUser.id,
      mobile: savedUser.mobile,
      onboardingStatus: savedUser.onboardingStatus,
      role: savedUser.role,
      email: savedUser.email,
    };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return res
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .json({ message: "KYC submitted successfully" });
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
}
