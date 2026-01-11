import {
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { UserIntegrationMappingEntity } from "@/entities/user-integration-mapping.entity";
import { IntegrationEntity } from "@/entities/integration.entity";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { CustomLogger } from "@/logger";

@Injectable()
export class IntegrationMappingService {
  private readonly logger = new CustomLogger(IntegrationMappingService.name);

  constructor(
    @InjectRepository(UserIntegrationMappingEntity)
    private readonly mappingRepository: Repository<UserIntegrationMappingEntity>,
    @InjectRepository(IntegrationEntity)
    private readonly integrationRepository: Repository<IntegrationEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get the integration code for a user (with caching)
   * @param userId - The user ID
   * @returns The integration code (e.g., "ONIK", "FYNTRA", "GEOPAY")
   * @throws NotFoundException if no active mapping is found
   */
  async getUserIntegration(userId: string): Promise<string> {
    const cacheKey = REDIS_KEYS.USER_INTEGRATION_MAPPING(userId);

    // Try cache first
    const cachedCode = await this.cacheManager.get<string>(cacheKey);
    if (cachedCode) {
      this.logger.debug(`Cache HIT for user integration mapping: ${userId}`);

      return cachedCode;
    }

    // Cache miss - fetch from database
    this.logger.debug(`Cache MISS for user integration mapping: ${userId}`);
    const mapping = await this.mappingRepository.findOne({
      where: {
        userId,
        isActive: true,
      },
      relations: ["integration"],
    });

    if (!mapping || !mapping.integration) {
      throw new NotFoundException(
        `No active integration mapping found for user: ${userId}`,
      );
    }

    const integrationCode = mapping.integration.code;

    // Store in cache (TTL: 1 hour)
    await this.cacheManager.set(cacheKey, integrationCode, 3600 * 1000);

    return integrationCode;
  }

  /**
   * Get user's integration mapping (full entity with relations)
   * @param userId - The user ID
   * @returns The mapping entity with integration details
   */
  async getUserIntegrationMapping(
    userId: string,
  ): Promise<UserIntegrationMappingEntity> {
    const mapping = await this.mappingRepository.findOne({
      where: {
        userId,
        isActive: true,
      },
      relations: ["integration"],
    });

    if (!mapping) {
      throw new NotFoundException(
        `No active integration mapping found for user: ${userId}`,
      );
    }

    return mapping;
  }

  /**
   * Update user's integration mapping
   * @param userId - The user ID
   * @param integrationCode - The new integration code
   * @returns Updated mapping entity
   */
  async updateUserIntegration(
    userId: string,
    integrationCode: string,
  ): Promise<UserIntegrationMappingEntity> {
    // Find integration by code
    const integration = await this.integrationRepository.findOne({
      where: { code: integrationCode.toUpperCase(), isActive: true },
    });

    if (!integration) {
      throw new NotFoundException(
        `Integration with code ${integrationCode} not found or inactive`,
      );
    }

    // Find existing mapping
    const existingMapping = await this.mappingRepository.findOne({
      where: { userId },
    });

    let mapping: UserIntegrationMappingEntity;

    if (existingMapping) {
      // Update existing mapping
      existingMapping.integrationId = integration.id;
      existingMapping.isActive = true;
      mapping = await this.mappingRepository.save(existingMapping);
    } else {
      // Create new mapping
      mapping = this.mappingRepository.create({
        userId,
        integrationId: integration.id,
        isActive: true,
      });
      mapping = await this.mappingRepository.save(mapping);
    }

    // Invalidate cache
    await this.invalidateUserMappingCache(userId);

    this.logger.info(
      `Updated integration mapping for user ${userId} to ${integrationCode}`,
    );

    return this.mappingRepository.findOne({
      where: { id: mapping.id },
      relations: ["integration"],
    });
  }

  /**
   * Invalidate cache for user's integration mapping
   * @param userId - The user ID
   */
  async invalidateUserMappingCache(userId: string): Promise<void> {
    const cacheKey = REDIS_KEYS.USER_INTEGRATION_MAPPING(userId);
    await this.cacheManager.del(cacheKey);
    this.logger.debug(
      `Invalidated cache for user integration mapping: ${userId}`,
    );
  }

  /**
   * Record transaction amount for limit tracking
   * @param integrationCode - The integration code
   * @param amount - The transaction amount
   */
  async recordTransactionAmount(
    integrationCode: string,
    amount: number,
  ): Promise<void> {
    const integration = await this.integrationRepository.findOne({
      where: { code: integrationCode.toUpperCase() },
    });

    if (!integration) {
      this.logger.warn(
        `Integration not found for limit tracking: ${integrationCode}`,
      );

      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reset daily limit if it's a new day
    if (
      !integration.lastResetDate ||
      integration.lastResetDate.getTime() !== today.getTime()
    ) {
      integration.dailyLimitConsumed = 0;
      integration.lastResetDate = today;

      // Reset monthly limit if it's a new month
      const lastResetMonth = integration.lastResetDate.getMonth();
      const currentMonth = today.getMonth();
      if (lastResetMonth !== currentMonth) {
        integration.monthlyLimitConsumed = 0;
      }
    }

    // Update consumed amounts
    integration.dailyLimitConsumed =
      Number(integration.dailyLimitConsumed) + amount;
    integration.monthlyLimitConsumed =
      Number(integration.monthlyLimitConsumed) + amount;

    await this.integrationRepository.save(integration);
  }
}
