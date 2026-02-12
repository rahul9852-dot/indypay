import { Injectable, NotFoundException, Inject } from "@nestjs/common";
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
   * Uses Redis counters for fast, non-blocking updates
   * Database is synced periodically via background job
   * @param integrationCode - The integration code
   * @param amount - The transaction amount
   */
  async recordTransactionAmount(
    integrationCode: string,
    amount: number,
  ): Promise<void> {
    try {
      const code = integrationCode.toUpperCase();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
      const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

      // Redis keys for counters
      const dailyKey = REDIS_KEYS.INTEGRATION_LIMIT_DAILY(code, todayStr);
      const monthlyKey = REDIS_KEYS.INTEGRATION_LIMIT_MONTHLY(code, yearMonth);
      const lastResetKey = REDIS_KEYS.INTEGRATION_LAST_RESET(code);

      // Check if we need to reset (compare with cached last reset date)
      const lastResetDate = await this.cacheManager.get<string>(lastResetKey);
      const needsDailyReset = !lastResetDate || lastResetDate !== todayStr;

      if (needsDailyReset) {
        // Reset daily counter
        await this.cacheManager.set(dailyKey, amount, 86400000); // 24 hours TTL
        await this.cacheManager.set(lastResetKey, todayStr, 86400000);

        // Check if monthly reset is needed
        if (lastResetDate) {
          const lastReset = new Date(lastResetDate);
          const needsMonthlyReset =
            lastReset.getMonth() !== today.getMonth() ||
            lastReset.getFullYear() !== today.getFullYear();

          if (needsMonthlyReset) {
            // Reset monthly counter
            await this.cacheManager.set(monthlyKey, amount, 2678400000); // ~31 days TTL
          } else {
            // Increment monthly counter
            const currentMonthly =
              (await this.cacheManager.get<number>(monthlyKey)) || 0;
            await this.cacheManager.set(
              monthlyKey,
              currentMonthly + amount,
              2678400000,
            );
          }
        } else {
          // First time - initialize monthly counter
          await this.cacheManager.set(monthlyKey, amount, 2678400000);
        }
      } else {
        // Increment both daily and monthly counters
        const currentDaily =
          (await this.cacheManager.get<number>(dailyKey)) || 0;
        const currentMonthly =
          (await this.cacheManager.get<number>(monthlyKey)) || 0;

        await Promise.all([
          this.cacheManager.set(dailyKey, currentDaily + amount, 86400000),
          this.cacheManager.set(
            monthlyKey,
            currentMonthly + amount,
            2678400000,
          ),
        ]);
      }
    } catch (error) {
      // Silently fail - this is a non-critical operation
      // Redis operations are fast and shouldn't fail, but if they do, we don't want to block
      this.logger.debug(
        `Failed to record transaction amount in Redis for ${integrationCode}: ${error.message}`,
      );
    }
  }

  /**
   * Get current limit consumption from Redis (fast, no DB hit)
   * Falls back to database if Redis is empty
   * @param integrationCode - The integration code
   * @returns Object with daily and monthly consumed amounts
   */
  async getLimitConsumption(integrationCode: string): Promise<{
    dailyConsumed: number;
    monthlyConsumed: number;
  }> {
    const code = integrationCode.toUpperCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const dailyKey = REDIS_KEYS.INTEGRATION_LIMIT_DAILY(code, todayStr);
    const monthlyKey = REDIS_KEYS.INTEGRATION_LIMIT_MONTHLY(code, yearMonth);

    const dailyConsumed = await this.cacheManager.get<number>(dailyKey);
    const monthlyConsumed = await this.cacheManager.get<number>(monthlyKey);

    // If Redis has values, return them
    if (dailyConsumed !== null && dailyConsumed !== undefined) {
      return {
        dailyConsumed: dailyConsumed || 0,
        monthlyConsumed: monthlyConsumed || 0,
      };
    }

    // Fallback to database if Redis is empty (first time or after restart)
    const integration = await this.integrationRepository.findOne({
      where: { code },
      select: ["dailyLimitConsumed", "monthlyLimitConsumed"],
    });

    if (integration) {
      // Initialize Redis with database values
      await Promise.all([
        this.cacheManager.set(
          dailyKey,
          Number(integration.dailyLimitConsumed) || 0,
          86400000,
        ),
        this.cacheManager.set(
          monthlyKey,
          Number(integration.monthlyLimitConsumed) || 0,
          2678400000,
        ),
      ]);

      return {
        dailyConsumed: Number(integration.dailyLimitConsumed) || 0,
        monthlyConsumed: Number(integration.monthlyLimitConsumed) || 0,
      };
    }

    return { dailyConsumed: 0, monthlyConsumed: 0 };
  }

  /**
   * Sync Redis counters to database (call this periodically via cron job)
   * This method should be called every few minutes to persist Redis data to DB
   */
  async syncLimitsToDatabase(): Promise<void> {
    try {
      // Get all integration codes
      const integrations = await this.integrationRepository.find({
        select: ["code"],
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      for (const integration of integrations) {
        const {code} = integration;
        const dailyKey = REDIS_KEYS.INTEGRATION_LIMIT_DAILY(code, todayStr);
        const monthlyKey = REDIS_KEYS.INTEGRATION_LIMIT_MONTHLY(
          code,
          yearMonth,
        );

        const dailyConsumed =
          (await this.cacheManager.get<number>(dailyKey)) || 0;
        const monthlyConsumed =
          (await this.cacheManager.get<number>(monthlyKey)) || 0;

        // Update database with Redis values
        await this.integrationRepository.update(
          { code },
          {
            dailyLimitConsumed: dailyConsumed,
            monthlyLimitConsumed: monthlyConsumed,
            lastResetDate: today,
          },
        );
      }

      this.logger.debug(
        `Synced limits to database for ${integrations.length} integrations`,
      );
    } catch (error) {
      this.logger.error(`Failed to sync limits to database: ${error.message}`);
    }
  }
}
