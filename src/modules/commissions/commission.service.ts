import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { CommissionEntity } from "@/entities/commission.entity";
import { CommissionSlabEntity } from "@/entities/commission-slab.entity";
import { UserCommissionMappingEntity } from "@/entities/user-commission-mapping.entity";
import { UsersEntity } from "@/entities/user.entity";
import { COMMISSION_TYPE, CHARGE_TYPE } from "@/enums/commission.enum";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { CustomLogger } from "@/logger";

export interface CommissionCalculationResult {
  commissionAmount: number;
  gstAmount: number;
  netPayableAmount: number;
  commissionId: string;
  commissionSlabId: string | null;
  chargeType: CHARGE_TYPE;
  chargeValue: number;
  gstPercentage: number;
}

@Injectable()
export class CommissionService {
  private readonly logger = new CustomLogger(CommissionService.name);

  constructor(
    @InjectRepository(CommissionEntity)
    private readonly commissionRepository: Repository<CommissionEntity>,
    @InjectRepository(CommissionSlabEntity)
    private readonly commissionSlabRepository: Repository<CommissionSlabEntity>,
    @InjectRepository(UserCommissionMappingEntity)
    private readonly userCommissionMappingRepository: Repository<UserCommissionMappingEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Get user's commission plan for payin/payout (with caching)
   */
  async getUserCommissionPlan(
    userId: string,
    type: COMMISSION_TYPE,
  ): Promise<CommissionEntity> {
    const cacheKey = REDIS_KEYS.USER_COMMISSION_PLAN(userId, type);
    let commissionPlan =
      await this.cacheManager.get<CommissionEntity>(cacheKey);

    if (!commissionPlan) {
      const mapping = await this.userCommissionMappingRepository.findOne({
        where: {
          userId,
          isActive: true,
        },
        relations: [
          type === COMMISSION_TYPE.PAYIN
            ? "payinCommission"
            : "payoutCommission",
        ],
      });

      if (!mapping) {
        // Fallback to default commission or user's legacy rates
        throw new NotFoundException(
          `No commission plan found for user ${userId} for type ${type}. Please assign a commission plan.`,
        );
      }

      commissionPlan =
        type === COMMISSION_TYPE.PAYIN
          ? mapping.payinCommission
          : mapping.payoutCommission;

      if (!commissionPlan || !commissionPlan.isActive) {
        throw new NotFoundException(
          `Commission plan not found or inactive for user ${userId}`,
        );
      }

      // Load slabs
      commissionPlan.slabs = await this.commissionSlabRepository.find({
        where: {
          commissionId: commissionPlan.id,
          isActive: true,
        },
        order: {
          priority: "DESC",
          minAmount: "ASC",
        },
      });

      // Cache for 1 hour
      await this.cacheManager.set(cacheKey, commissionPlan, 3600);
    }

    return commissionPlan;
  }

  /**
   * Calculate commission for a given amount using user's commission plan
   */
  async calculateCommission(
    userId: string,
    amount: number,
    type: COMMISSION_TYPE = COMMISSION_TYPE.PAYIN,
  ): Promise<CommissionCalculationResult> {
    const commissionPlan = await this.getUserCommissionPlan(userId, type);

    // Find applicable slab
    const applicableSlab = this.findApplicableSlab(
      commissionPlan.slabs,
      amount,
    );

    if (!applicableSlab) {
      // No slab found - use default from user's legacy rates (fallback)
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User not found: ${userId}`);
      }

      const commissionInPercentage =
        type === COMMISSION_TYPE.PAYIN
          ? user.commissionInPercentagePayin || 4.5
          : user.commissionInPercentagePayout || 1.5;
      const gstInPercentage =
        type === COMMISSION_TYPE.PAYIN
          ? user.gstInPercentagePayin || 18
          : user.gstInPercentagePayout || 18;

      const commissionAmount = (amount * commissionInPercentage) / 100;
      const gstAmount = (commissionAmount * gstInPercentage) / 100;
      const netPayableAmount = amount - commissionAmount - gstAmount;

      return {
        commissionAmount,
        gstAmount,
        netPayableAmount,
        commissionId: commissionPlan.id,
        commissionSlabId: null as any, // No slab applied
        chargeType: CHARGE_TYPE.PERCENTAGE,
        chargeValue: commissionInPercentage,
        gstPercentage: gstInPercentage,
      };
    }

    // Calculate commission based on slab
    let commissionAmount: number;
    if (applicableSlab.chargeType === CHARGE_TYPE.PERCENTAGE) {
      commissionAmount = (amount * applicableSlab.chargeValue) / 100;
    } else {
      // FLAT charge
      commissionAmount = applicableSlab.chargeValue;
    }

    const gstPercentage =
      applicableSlab.gstPercentage ?? commissionPlan.defaultGstPercentage;
    const gstAmount = (commissionAmount * gstPercentage) / 100;
    const netPayableAmount = amount - commissionAmount - gstAmount;

    return {
      commissionAmount,
      gstAmount,
      netPayableAmount,
      commissionId: commissionPlan.id,
      commissionSlabId: applicableSlab.id,
      chargeType: applicableSlab.chargeType,
      chargeValue: applicableSlab.chargeValue,
      gstPercentage,
    };
  }

  /**
   * Find the applicable slab for a given amount
   * Slabs are sorted by priority (DESC) and minAmount (ASC)
   */
  private findApplicableSlab(
    slabs: CommissionSlabEntity[],
    amount: number,
  ): CommissionSlabEntity | null {
    for (const slab of slabs) {
      if (
        amount >= slab.minAmount &&
        (slab.maxAmount === null || amount < slab.maxAmount)
      ) {
        return slab;
      }
    }

    return null;
  }

  /**
   * Invalidate user's commission plan cache
   */
  async invalidateUserCommissionCache(
    userId: string,
    type?: COMMISSION_TYPE,
  ): Promise<void> {
    if (type) {
      const cacheKey = REDIS_KEYS.USER_COMMISSION_PLAN(userId, type);
      await this.cacheManager.del(cacheKey);
    } else {
      // Invalidate both payin and payout
      await this.cacheManager.del(
        REDIS_KEYS.USER_COMMISSION_PLAN(userId, COMMISSION_TYPE.PAYIN),
      );
      await this.cacheManager.del(
        REDIS_KEYS.USER_COMMISSION_PLAN(userId, COMMISSION_TYPE.PAYOUT),
      );
    }
  }

  // ========== CRUD Operations ==========

  async createCommission(createDto: any): Promise<CommissionEntity> {
    const commission = this.commissionRepository.create({
      name: createDto.name,
      type: createDto.type,
      description: createDto.description,
      defaultGstPercentage: createDto.defaultGstPercentage ?? 18,
      isActive: true,
    });

    return await this.commissionRepository.save(commission);
  }

  async getAllCommissions(): Promise<CommissionEntity[]> {
    return await this.commissionRepository.find({
      relations: ["slabs"],
      order: { createdAt: "DESC" },
    });
  }

  async getCommissionById(id: string): Promise<CommissionEntity> {
    const commission = await this.commissionRepository.findOne({
      where: { id },
      relations: ["slabs"],
    });

    if (!commission) {
      throw new NotFoundException(`Commission plan not found: ${id}`);
    }

    return commission;
  }

  async updateCommission(
    id: string,
    updateDto: any,
  ): Promise<CommissionEntity> {
    const commission = await this.getCommissionById(id);

    Object.assign(commission, updateDto);
    const updated = await this.commissionRepository.save(commission);

    // Invalidate cache for all users with this commission
    // Note: This is a simple implementation. For production, you might want to track which users use this commission.
    this.logger.warn(
      `Commission ${id} updated. Consider invalidating user caches manually.`,
    );

    return updated;
  }

  async deleteCommission(id: string): Promise<void> {
    const commission = await this.getCommissionById(id);

    // Check if any users are using this commission
    const userCount = await this.userCommissionMappingRepository.count({
      where: [{ payinCommissionId: id }, { payoutCommissionId: id }],
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete commission plan. ${userCount} user(s) are currently using it.`,
      );
    }

    await this.commissionRepository.remove(commission);
  }

  async addSlab(
    commissionId: string,
    createSlabDto: any,
  ): Promise<CommissionSlabEntity> {
    const commission = await this.getCommissionById(commissionId);

    const slab = this.commissionSlabRepository.create({
      commissionId: commission.id,
      minAmount: createSlabDto.minAmount,
      maxAmount: createSlabDto.maxAmount ?? null,
      chargeType: createSlabDto.chargeType,
      chargeValue: createSlabDto.chargeValue,
      gstPercentage: createSlabDto.gstPercentage ?? null,
      priority: createSlabDto.priority ?? 0,
      isActive: true,
    });

    return await this.commissionSlabRepository.save(slab);
  }

  async updateSlab(
    slabId: string,
    updateSlabDto: any,
  ): Promise<CommissionSlabEntity> {
    const slab = await this.commissionSlabRepository.findOne({
      where: { id: slabId },
    });

    if (!slab) {
      throw new NotFoundException(`Commission slab not found: ${slabId}`);
    }

    Object.assign(slab, updateSlabDto);

    return await this.commissionSlabRepository.save(slab);
  }

  async deleteSlab(slabId: string): Promise<void> {
    const slab = await this.commissionSlabRepository.findOne({
      where: { id: slabId },
    });

    if (!slab) {
      throw new NotFoundException(`Commission slab not found: ${slabId}`);
    }

    await this.commissionSlabRepository.remove(slab);
  }

  async assignCommissionToUser(
    userId: string,
    assignDto: any,
  ): Promise<UserCommissionMappingEntity> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    // Verify commission plans exist
    await this.getCommissionById(assignDto.payinCommissionId);
    if (assignDto.payoutCommissionId) {
      await this.getCommissionById(assignDto.payoutCommissionId);
    }

    // Check if mapping exists
    let mapping = await this.userCommissionMappingRepository.findOne({
      where: { userId },
    });

    if (mapping) {
      mapping.payinCommissionId = assignDto.payinCommissionId;
      mapping.payoutCommissionId = assignDto.payoutCommissionId ?? null;
      mapping.isActive = true;
    } else {
      mapping = this.userCommissionMappingRepository.create({
        userId,
        payinCommissionId: assignDto.payinCommissionId,
        payoutCommissionId: assignDto.payoutCommissionId ?? null,
        isActive: true,
      });
    }

    const saved = await this.userCommissionMappingRepository.save(mapping);

    // Invalidate cache
    await this.invalidateUserCommissionCache(userId);

    return saved;
  }

  async getUserCommissionMapping(
    userId: string,
  ): Promise<UserCommissionMappingEntity> {
    const mapping = await this.userCommissionMappingRepository.findOne({
      where: { userId, isActive: true },
      relations: ["payinCommission", "payoutCommission"],
    });

    if (!mapping) {
      throw new NotFoundException(
        `No commission plan assigned to user: ${userId}`,
      );
    }

    return mapping;
  }
}
