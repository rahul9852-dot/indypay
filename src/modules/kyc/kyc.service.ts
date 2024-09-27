import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersEntity } from "@/entities/user.entity";
import { IAccessTokenPayload } from "@/interface/common.interface";

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
  ) {}

  async getKycStatus(user: IAccessTokenPayload) {
    const userEntity = await this.userRepository.findOne({
      where: { id: user.id },
      select: ["kyc"],
    });

    return { userId: user.id, kycStatus: userEntity?.kyc?.kycStatus || 0 };
  }
}
