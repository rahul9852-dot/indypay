import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { STATUS } from "enums";
import { MessageResponseDto } from "dtos/common.dto";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { MerchantsEntity } from "entities/merchants.entity";
import { CreateMerchantDto } from "./merchants.dto";

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(MerchantsEntity)
    private readonly _merchantsRepository: Repository<MerchantsEntity>,
    private readonly _bcryptService: BcryptService,
  ) {}

  async findMerchantByEmail(email: string): Promise<MerchantsEntity> {
    return this._merchantsRepository.findOne({ where: { email } });
  }

  async findMerchantById(id: string): Promise<MerchantsEntity> {
    return this._merchantsRepository.findOne({
      where: { id },
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

  async createMerchant(
    merchant: CreateMerchantDto,
  ): Promise<MessageResponseDto> {
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
    });

    // Save merchant
    await this._merchantsRepository.save(createdMerchant);

    return new MessageResponseDto("Merchant created successfully");
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
}
