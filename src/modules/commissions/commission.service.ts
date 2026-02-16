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
import { CommissionPlanCacheDTO } from "./dto/assign-commission-to-user.dto";
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
  // async getUserCommissionPlan(
  //   userId: string,
  //   type: COMMISSION_TYPE,
  // ): Promise<CommissionEntity> {
  //   const cacheKey = REDIS_KEYS.USER_COMMISSION_PLAN(userId, type);
  //   this.logger.info(
  //     `[COMMISSION] getUserCommissionPlan called for ${userId}:${type}, cacheKey: ${cacheKey}`,
  //   );

  //   // ✅ OPTIMIZED: Add error handling for Redis cache lookup
  //   // If Redis is slow or fails, we'll still try database (but log it)
  //   let commissionPlan: CommissionEntity | null = null;
  //   const cacheStartTime = Date.now();
  //   try {
  //     commissionPlan = await this.cacheManager.get<CommissionEntity>(cacheKey);
  //     const cacheTime = Date.now() - cacheStartTime;
  //     this.logger.info(
  //       `[COMMISSION] Cache lookup took ${cacheTime}ms for ${userId}:${type}, found: ${!!commissionPlan}`,
  //     );
  //     if (commissionPlan) {
  //       // ✅ CRITICAL FIX: Check if slabs are loaded (they might not serialize properly)
  //       // If slabs are missing or empty, reload them from database
  //       if (!commissionPlan.slabs || commissionPlan.slabs.length === 0) {
  //         this.logger.warn(
  //           `[COMMISSION] ⚠️ Cache HIT but slabs missing for ${userId}:${type}, planId: ${commissionPlan.id} - Querying DB for slabs - THIS WILL TIMEOUT IF CONNECTION POOL EXHAUSTED`,
  //         );
  //         const slabsQueryStart = Date.now();
  //         // Reload slabs from database
  //         commissionPlan.slabs = await this.commissionSlabRepository.find({
  //           where: {
  //             commissionId: commissionPlan.id,
  //             isActive: true,
  //           },
  //           order: {
  //             priority: "DESC",
  //             minAmount: "ASC",
  //           },
  //         });
  //         const slabsQueryTime = Date.now() - slabsQueryStart;
  //         this.logger.info(
  //           `[COMMISSION] Slabs query took ${slabsQueryTime}ms, found ${commissionPlan.slabs.length} slabs for planId: ${commissionPlan.id}`,
  //         );
  //         // Update cache with slabs
  //         try {
  //           await this.cacheManager.set(cacheKey, commissionPlan, 36000);
  //         } catch (error: any) {
  //           // Log but don't fail
  //           this.logger.warn(
  //             `Failed to update cache with slabs ${userId}:${type}: ${error.message}`,
  //           );
  //         }
  //       } else {
  //         this.logger.debug(
  //           `Cache HIT with slabs for commission plan: ${userId}:${type} (${commissionPlan.slabs.length} slabs)`,
  //         );
  //       }

  //       return commissionPlan;
  //     }
  //     this.logger.debug(
  //       `Cache MISS for commission plan: ${userId}:${type} - Fetching from DB`,
  //     );
  //   } catch (error: any) {
  //     // Redis error - log but continue to database fallback
  //     this.logger.warn(
  //       `Redis cache error for commission plan ${userId}:${type}, falling back to DB: ${error.message}`,
  //     );
  //   }

  //   if (!commissionPlan) {
  //     this.logger.warn(
  //       `[COMMISSION] Cache MISS - Querying database for ${userId}:${type} - THIS WILL TIMEOUT IF CONNECTION POOL EXHAUSTED`,
  //     );
  //     const dbQueryStart = Date.now();
  //     let mapping;
  //     try {
  //       mapping = await this.userCommissionMappingRepository.findOne({
  //         where: {
  //           userId,
  //           isActive: true,
  //         },
  //         relations: [
  //           type === COMMISSION_TYPE.PAYIN
  //             ? "payinCommission"
  //             : "payoutCommission",
  //         ],
  //       });
  //       const dbQueryTime = Date.now() - dbQueryStart;
  //       this.logger.info(
  //         `[COMMISSION] ✅ Database query completed in ${dbQueryTime}ms for ${userId}:${type}`,
  //       );
  //     } catch (error: any) {
  //       const dbQueryTime = Date.now() - dbQueryStart;
  //       this.logger.error(
  //         `[COMMISSION] ❌ Database query FAILED after ${dbQueryTime}ms for ${userId}:${type} - ${error.message}. Connection pool likely exhausted.`,
  //       );
  //       // Re-throw so the error propagates up
  //       throw error;
  //     }

  //     if (!mapping) {
  //       // Fallback to default commission or user's legacy rates
  //       throw new NotFoundException(
  //         `No commission plan found for user ${userId} for type ${type}. Please assign a commission plan.`,
  //       );
  //     }

  //     commissionPlan =
  //       type === COMMISSION_TYPE.PAYIN
  //         ? mapping.payinCommission
  //         : mapping.payoutCommission;

  //     if (!commissionPlan || !commissionPlan.isActive) {
  //       throw new NotFoundException(
  //         `Commission plan not found or inactive for user ${userId}`,
  //       );
  //     }

  //     // Load slabs
  //     this.logger.info(
  //       `[COMMISSION] Loading slabs for planId: ${commissionPlan.id}, userId: ${userId}`,
  //     );
  //     const slabsQueryStart = Date.now();
  //     commissionPlan.slabs = await this.commissionSlabRepository.find({
  //       where: {
  //         commissionId: commissionPlan.id,
  //         isActive: true,
  //       },
  //       order: {
  //         priority: "DESC",
  //         minAmount: "ASC",
  //       },
  //     });
  //     const slabsQueryTime = Date.now() - slabsQueryStart;
  //     this.logger.info(
  //       `[COMMISSION] Slabs loaded in ${slabsQueryTime}ms, found ${commissionPlan.slabs.length} slabs for planId: ${commissionPlan.id}`,
  //     );

  //     // ✅ CRITICAL: Cache for 1 hour - MUST succeed to avoid future timeouts
  //     this.logger.info(
  //       `[COMMISSION] Attempting to cache commission plan ${userId}:${type} with ${commissionPlan.slabs.length} slabs`,
  //     );
  //     const cacheSetStart = Date.now();
  //     try {
  //       // ✅ CRITICAL: Ensure slabs are properly serialized (TypeORM entities don't serialize relations well)
  //       const planToCache = {
  //         ...commissionPlan,
  //         slabs: commissionPlan.slabs.map((slab) => ({
  //           id: slab.id,
  //           commissionId: slab.commissionId,
  //           minAmount: slab.minAmount,
  //           maxAmount: slab.maxAmount,
  //           chargeType: slab.chargeType,
  //           chargeValue: slab.chargeValue,
  //           gstPercentage: slab.gstPercentage,
  //           priority: slab.priority,
  //           isActive: slab.isActive,
  //         })),
  //       };
  //       await this.cacheManager.set(cacheKey, planToCache, 36000);
  //       const cacheSetTime = Date.now() - cacheSetStart;
  //       this.logger.info(
  //         `[COMMISSION] ✅ Successfully cached commission plan ${userId}:${type} in ${cacheSetTime}ms with ${commissionPlan.slabs.length} slabs`,
  //       );
  //     } catch (error: any) {
  //       // Log but don't fail - cache is optional
  //       this.logger.error(
  //         `[COMMISSION] ❌ FAILED to cache commission plan ${userId}:${type}: ${error.message} - This will cause future timeouts!`,
  //       );
  //     }
  //   }

  //   return commissionPlan;
  // }

  async getUserCommissionPlan(
    userId: string,
    type: COMMISSION_TYPE,
  ): Promise<CommissionPlanCacheDTO> {
    const cacheKey = REDIS_KEYS.USER_COMMISSION_PLAN(userId, type);
    const TTL = 86400; // 1 day

    // 1️⃣ TRY CACHE FIRST (simple read - no locks needed!)
    try {
      const cached =
        await this.cacheManager.get<CommissionPlanCacheDTO>(cacheKey);
      if (cached && cached.slabs?.length) {
        this.logger.debug(`[COMMISSION] Cache HIT ${userId}:${type}`);

        return cached;
      }
    } catch (err: any) {
      // Redis failed? No problem, just query DB
      this.logger.warn(
        `[COMMISSION] Cache read failed, using DB: ${err.message}`,
      );
    }

    // 2️⃣ CACHE MISS → QUERY DB
    // Multiple requests hitting at once? That's fine! They'll all query DB,
    // first one to finish populates cache, others will use it next time.
    this.logger.info(`[COMMISSION] Cache MISS → DB ${userId}:${type}`);

    const mapping = await this.userCommissionMappingRepository.findOne({
      where: { userId, isActive: true },
      relations: [
        type === COMMISSION_TYPE.PAYIN ? "payinCommission" : "payoutCommission",
      ],
    });

    if (!mapping) {
      throw new NotFoundException(
        `No commission plan mapped for user ${userId}`,
      );
    }

    const commission =
      type === COMMISSION_TYPE.PAYIN
        ? mapping.payinCommission
        : mapping.payoutCommission;

    if (!commission || !commission.isActive) {
      throw new NotFoundException(`Inactive commission plan for ${userId}`);
    }

    // Load slabs
    const slabs = await this.commissionSlabRepository.find({
      where: { commissionId: commission.id, isActive: true },
      order: { priority: "DESC", minAmount: "ASC" },
    });

    if (!slabs.length) {
      throw new Error(`No slabs found for commission ${commission.id}`);
    }

    // Build DTO
    const dto: CommissionPlanCacheDTO = {
      id: commission.id,
      isActive: commission.isActive,
      slabs: slabs.map((s) => ({
        id: s.id,
        commissionId: s.commissionId,
        minAmount: s.minAmount,
        maxAmount: s.maxAmount,
        chargeType: s.chargeType,
        chargeValue: s.chargeValue,
        gstPercentage: s.gstPercentage,
        priority: s.priority,
        isActive: s.isActive,
      })),
    };

    // 3️⃣ WRITE TO CACHE (best effort - don't block if it fails)
    try {
      await this.cacheManager.set(cacheKey, dto, TTL);
      this.logger.debug(`[COMMISSION] Cached ${userId}:${type}`);
    } catch (err: any) {
      // Cache write failed? No problem, we still have the data
      this.logger.warn(`[COMMISSION] Cache write failed: ${err.message}`);
    }

    return dto;
  }

  /**
   * Calculate commission for a given amount using user's commission plan
   * @param userId - User ID
   * @param amount - Transaction amount
   * @param type - Commission type (PAYIN or PAYOUT)
   * @param userCommissionRates - Optional user commission rates to avoid database query
   */
  async calculateCommission(
    userId: string,
    amount: number,
    type: COMMISSION_TYPE = COMMISSION_TYPE.PAYIN,
  ): Promise<CommissionCalculationResult> {
    const commissionPlan = await this.getUserCommissionPlan(userId, type);

    // Find applicable slab
    const applicableSlab = this.findApplicableSlab(
      commissionPlan.slabs as CommissionSlabEntity[],
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
      applicableSlab.gstPercentage ??
      commissionPlan.slabs[0]?.gstPercentage ??
      18;
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
