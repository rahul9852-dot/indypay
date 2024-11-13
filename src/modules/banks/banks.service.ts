import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  AddBankDetailsDto,
  UpdateBankDetailsDto,
} from "./dto/add-bank-details.dto";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto } from "@/dtos/common.dto";

@Injectable()
export class BanksService {
  constructor(
    @InjectRepository(UserBankDetailsEntity)
    private readonly bankRepository: Repository<UserBankDetailsEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
  ) {}

  async updateBank(bankId: string, updateBankDetailsDto: UpdateBankDetailsDto) {
    const bank = await this.bankRepository.findOne({
      where: {
        id: bankId,
      },
    });

    if (!bank) {
      throw new NotFoundException(new MessageResponseDto("Bank not found"));
    }

    const updatedBank = this.bankRepository.create({
      id: bankId,
      ...updateBankDetailsDto,
    });

    await this.bankRepository.save(updatedBank);

    return new MessageResponseDto("Bank updated successfully");
  }

  async deleteBank(bankId: string) {
    const bank = await this.bankRepository.findOne({
      where: {
        id: bankId,
      },
    });

    if (!bank) {
      throw new NotFoundException(new MessageResponseDto("Bank not found"));
    }

    await this.bankRepository.delete({
      id: bankId,
    });

    return new MessageResponseDto("Bank deleted successfully");
  }

  async getAllBanks(userId: string) {
    return await this.bankRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async addBank(userId: string, addBankDetailsDto: AddBankDetailsDto) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const bank = this.bankRepository.create({
      user,
      ...addBankDetailsDto,
    });
    await this.bankRepository.save(bank);

    return new MessageResponseDto("Bank added successfully");
  }

  async getBankByUserId(userId: string) {
    return await this.bankRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      select: {
        id: true,
        bankName: true,
      },
    });
  }

  async getBankByBankId(bankId: string) {
    return await this.bankRepository.findOne({
      where: {
        id: bankId,
      },
    });
  }
}
