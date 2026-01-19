import { Injectable, BadRequestException } from "@nestjs/common";
import { CreatePayinTransactionFlaPayDto } from "@/modules/payments/dto/create-payin-payment.dto";
import { UsersEntity } from "@/entities/user.entity";
import { OnikPayinService } from "@/modules/payments/payin/integrations/onik-payin.service";
import { GeoPayPayinService } from "@/modules/payments/payin/integrations/geopay-payin.service";
import { UtkarshPayinService } from "@/modules/payments/payin/integrations/utkarsh-payin.service";
import { CustomLogger } from "@/logger";

@Injectable()
export class IntegrationPayinRouterService {
  private readonly logger = new CustomLogger(
    IntegrationPayinRouterService.name,
  );

  constructor(
    private readonly onikPayinService: OnikPayinService,
    private readonly geoPayPayinService: GeoPayPayinService,
    private readonly utkarshPayinService: UtkarshPayinService,
  ) {}

  /**
   * Route payin request to the appropriate integration based on integration code
   * @param integrationCode - The integration code (e.g., "ONIK", "FYNTRA", "GEOPAY", "UTKARSH")
   * @param createPayinTransactionDto - The payin transaction DTO
   * @param user - The user entity
   * @returns The payment link/response from the selected integration
   */
  async routePayin(
    integrationCode: string,
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ) {
    const code = integrationCode.toUpperCase();

    this.logger.info(
      `Routing payin request to integration: ${code} for user: ${user.id}`,
    );

    switch (code) {
      case "ONIK":
        return this.onikPayinService.createPayin(
          createPayinTransactionDto,
          user,
        );

      case "GEOPAY":
        return this.geoPayPayinService.createPayin(
          createPayinTransactionDto as any,
          user,
        );

      case "UTKARSH":
        return this.utkarshPayinService.createPayin(
          createPayinTransactionDto,
          user,
        );

      default:
        throw new BadRequestException(
          `Unsupported integration code: ${integrationCode}. Supported codes: ONIK, FYNTRA, GEOPAY, UTKARSH. To add a new integration, create a service file in payin/integrations/ and add it here.`,
        );
    }
  }
}
