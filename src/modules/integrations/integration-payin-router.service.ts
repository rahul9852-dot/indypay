import { Injectable, BadRequestException } from "@nestjs/common";
import { CreatePayinTransactionAnviNeoDto } from "@/modules/payments/dto/create-payin-payment.dto";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger } from "@/logger";

@Injectable()
export class IntegrationPayinRouterService {
  private readonly logger = new CustomLogger(
    IntegrationPayinRouterService.name,
  );

  /**
   * Route payin request to the appropriate integration based on integration code.
   * Add new cases here as integrations are onboarded.
   */
  async routePayin(
    integrationCode: string,
    _createPayinTransactionDto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
  ) {
    const code = integrationCode.toUpperCase();

    this.logger.info(
      `Routing payin request to integration: ${code} for user: ${user.id}`,
    );

    switch (code) {
      default:
        throw new BadRequestException(
          `Unsupported integration code: ${integrationCode}. No active integrations are currently configured.`,
        );
    }
  }
}
