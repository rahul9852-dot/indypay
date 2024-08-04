import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ONBOARDING_STATUS, OTP_TYPE, STATUS } from "enums";
import { MessageResponseDto } from "dtos/common.dto";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { MerchantsEntity } from "entities/merchants.entity";
import { IPendingSignUpPayload } from "interface/common.interface";
import { OtpEntity } from "entities/otp.entity";
import { BusinessDetailsEntity } from "entities/business-details.entity";
import { generateOtp } from "utils/helperFunctions.utils";
import {
  BusinessDetailsDto,
  CreateMerchantDto,
  VerifyOtpDto,
} from "./merchants.dto";

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantsEntity)
    private readonly _merchantsRepository: Repository<MerchantsEntity>,
    @InjectRepository(OtpEntity)
    private readonly _otpRepository: Repository<OtpEntity>,
    @InjectRepository(BusinessDetailsEntity)
    private readonly _businessDetailsRepository: Repository<BusinessDetailsEntity>,
    private readonly _bcryptService: BcryptService,
  ) {}

  async findMerchantByEmail(email: string): Promise<MerchantsEntity> {
    return this._merchantsRepository.findOne({ where: { email } });
  }

  async findMerchantById(id: string): Promise<MerchantsEntity> {
    return this._merchantsRepository.findOne({
      where: { id },
      relations: ["businessDetails"],
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        image: true,
        mobile: true,
        isKycVerified: true,
        isEmailVerified: true,
        isMobileVerified: true,
        isWhatsAppAlertsEnabled: true,
        onboardingStatus: true,
        createdAt: true,
        updatedAt: true,
        businessDetails: {
          id: true,
          businessName: true,
          businessType: true,
          currentAccount: true,
        },
      },
    });
  }

  async findMerchants() {
    return this._merchantsRepository.find({
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        image: true,
        mobile: true,
        isKycVerified: true,
        isEmailVerified: true,
        isMobileVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMerchant(merchant: CreateMerchantDto): Promise<MerchantsEntity> {
    // Check if merchant already exists
    const existingMerchant = await this.findMerchantByEmail(merchant.email);

    if (existingMerchant) {
      throw new BadRequestException(
        new MessageResponseDto("Merchant already exists"),
      );
    }

    // Hash password
    const { password, ...rest } = merchant;
    const hashedPassword = await this._bcryptService.hashPassword(password);

    // Create new merchant
    const createdMerchant = this._merchantsRepository.create({
      ...rest,
      password: hashedPassword,
      onboardingStatus: ONBOARDING_STATUS.SIGN_UP,
    });

    // Save merchant
    const savedMerchant = await this._merchantsRepository.save(createdMerchant);

    // generate otp for email
    const generatedEmailOtp = generateOtp();
    const generatedMobileOtp = generateOtp();

    const createdOtp = this._otpRepository.create({
      type: OTP_TYPE.EMAIL,
      emailOtp: generatedEmailOtp,
      mobileOtp: generatedMobileOtp,
      merchantId: savedMerchant.id,
    });

    // Save otp
    await this._otpRepository.save(createdOtp);

    //TODO: send otp to email & mobile

    return savedMerchant;
  }

  async findActiveMerchant(email: string): Promise<MerchantsEntity> {
    return this._merchantsRepository.findOne({
      where: { email, status: STATUS.ACTIVE },
    });
  }

  async changeStatus(id: string, status: STATUS): Promise<MessageResponseDto> {
    // Check if merchant exists
    const merchant = await this.findMerchantById(id);
    if (!merchant) {
      throw new NotFoundException(
        new MessageResponseDto("Merchant does not exist"),
      );
    }

    // change status of merchant
    const newMerchant = this._merchantsRepository.create({
      ...merchant,
      status,
    });

    // Save merchant
    await this._merchantsRepository.save(newMerchant);

    return new MessageResponseDto(
      `Merchant ${status === STATUS.ACTIVE ? "activated" : "deactivated"} successfully`,
    );
  }

  async verifyOtp(
    pendingSignUpPayload: IPendingSignUpPayload,
    verifyOtpDto: VerifyOtpDto,
  ) {
    // Check if merchant exists
    const merchant = await this.findMerchantById(pendingSignUpPayload.id);
    if (!merchant) {
      throw new NotFoundException(
        new MessageResponseDto("Merchant does not exist"),
      );
    }

    // Verify OTP

    const verifiedOtp = await this._otpRepository.findOne({
      where: {
        merchantId: merchant.id,
        emailOtp: verifyOtpDto.emailOtp,
        mobileOtp: verifyOtpDto.mobileOtp,
        type: OTP_TYPE.EMAIL,
      },
    });

    if (!verifiedOtp) {
      throw new BadRequestException(new MessageResponseDto("Invalid OTP"));
    }

    // Update merchant
    const newMerchant = this._merchantsRepository.create({
      ...merchant,
      isEmailVerified: true,
      isMobileVerified: true,
      onboardingStatus: ONBOARDING_STATUS.MOBILE_EMAIL_VERIFIED,
    });

    // Save merchant
    await this._merchantsRepository.save(newMerchant);

    // Delete OTP
    this._otpRepository.delete(verifiedOtp.id);

    return new MessageResponseDto("Merchant verified successfully");
  }

  async addBusinessDetails(
    pendingSignUpPayload: IPendingSignUpPayload,
    businessDetailsDto: BusinessDetailsDto,
  ) {
    // Check if merchant exists
    const merchant = await this.findMerchantByEmail(pendingSignUpPayload.email);
    if (!merchant) {
      throw new NotFoundException(
        new MessageResponseDto("Merchant does not exist"),
      );
    }

    if (!merchant.isEmailVerified || !merchant.isMobileVerified) {
      throw new BadRequestException(
        new MessageResponseDto("Merchant not verified"),
      );
    }

    const existingBusinessDetails =
      await this._businessDetailsRepository.findOne({
        where: { merchantId: merchant.id },
      });

    if (existingBusinessDetails) {
      throw new BadRequestException(
        new MessageResponseDto("Business details already exists"),
      );
    }

    // Add business details
    const newBusinessDetails = this._businessDetailsRepository.create({
      ...businessDetailsDto,
      merchantId: merchant.id,
    });

    // Save business details
    await this._businessDetailsRepository.save(newBusinessDetails);

    // Update merchant
    const newMerchant = this._merchantsRepository.create({
      ...merchant,
      onboardingStatus: ONBOARDING_STATUS.FILLED_PERSONAL_BUSINESS_DETAILS,
    });

    // Save merchant
    await this._merchantsRepository.save(newMerchant);

    return new MessageResponseDto("Business details added successfully");
  }
}
