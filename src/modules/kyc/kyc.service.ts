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
import { UserMediaKycEntity } from "@/entities/user-media-kyc.entity";
import { UserBusinessDetailsEntity } from "@/entities/user-business.entity";
import { COOKIE_KEYS, KYC_STATUS, ONBOARDING_STATUS } from "@/enums";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";
import { appConfig } from "@/config/app.config";
import { AuthService } from "@/modules/auth/auth.service";

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
    @InjectRepository(UserMediaKycEntity)
    private readonly userMediaKycRepository: Repository<UserMediaKycEntity>,
    @InjectRepository(UserBusinessDetailsEntity)
    private readonly userBusinessRepository: Repository<UserBusinessDetailsEntity>,
    @InjectRepository(UserKycEntity)
    private readonly userKycRepository: Repository<UserKycEntity>,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
  ) {}

  async getKycStatus(user: IAccessTokenPayload) {
    const userEntity = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ["businessDetails", "kyc"],
    });

    return {
      userId: user.id,
      kycStatus: userEntity?.businessDetails?.kycStatus || "pending",
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
      relations: ["businessDetails", "kyc", "mediaKyc"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.userRepository.save(
      this.userRepository.create({
        id: userId,
        onboardingStatus: ONBOARDING_STATUS.KYC_PENDING,
      }),
    );

    // Update or create business details
    const businessDetails =
      user.businessDetails || new UserBusinessDetailsEntity();
    Object.assign(businessDetails, {
      personalPan: kycData.personalInfo.personalPanNumber,
      personalEmailId: kycData.personalInfo.email,
      designation: kycData.personalInfo.designation,
      businessName: kycData.businessStructure.businessName,
      registerBusinessNumber:
        kycData.businessStructure.registeredBusinessNumber,
      businessEntityType: kycData.businessStructure.typeOfBusiness,
      businessIndustry: kycData.businessStructure.industryName,
      turnover: kycData.businessStructure.turnover,
      kycStatus: KYC_STATUS.PENDING,
    });

    const savedBusinessDetails =
      await this.userBusinessRepository.save(businessDetails);

    // Create UserKycEntity if it doesn't exist
    const userKyc = user.kyc || new UserKycEntity();
    userKyc.kycStatus = KYC_STATUS.PENDING;
    user.onboardingStatus = ONBOARDING_STATUS.KYC_PENDING;
    userKyc.user = user;
    const savedUserKyc = await this.userKycRepository.save(userKyc);

    user.businessDetails = savedBusinessDetails;
    user.kyc = savedUserKyc;

    await this.userRepository.save(user);

    // Create and save MediaKycEntity entries for each document
    const documentMappings = [
      {
        doc: kycData.documents.panCard,
        type: "panCard",
        idField: "panId",
      },
      {
        doc: kycData.documents.aadharNumber,
        type: "aadharNumber",
        idField: "aadharId",
      },
      {
        doc: kycData.documents.addressProof,
        type: "addressProof",
        idField: "addressProofId",
      },
      {
        doc: kycData.documents.bankStatement,
        type: "bankStatement",
        idField: "bankStatementId",
      },
    ];

    // Process each document and create MediaKycEntity
    for (const mapping of documentMappings) {
      const mediaKyc = new UserMediaKycEntity();
      mediaKyc.documentType = mapping.type;
      mediaKyc.documentUrl = mapping.doc.url;
      mediaKyc.status = KYC_STATUS.PENDING;
      mediaKyc.user = user;
      mediaKyc.userKyc = savedUserKyc;

      const savedMediaKyc = await this.userMediaKycRepository.save(mediaKyc);

      // Update the corresponding ID in UserKycEntity
      savedUserKyc[mapping.idField] = savedMediaKyc.id;
    }

    await this.userRepository.save(user);

    // Save the updated UserKycEntity with document IDs
    await this.userKycRepository.save(savedUserKyc);

    const payload: IAccessTokenPayload = {
      id: user.id,
      mobile: user.mobile,
      onboardingStatus: user.onboardingStatus,
      role: user.role,
      email: user.email,
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
}
