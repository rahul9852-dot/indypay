import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { CreatePayinTransactionFlaPayDto } from "@/modules/payments/dto/create-payin-payment.dto";
import { UsersEntity } from "@/entities/user.entity";
import { PaymentsService } from "@/modules/payments/payments.service";
import { CustomLogger } from "@/logger";

@Injectable()
export class IntegrationPayinRouterService {
  private readonly logger = new CustomLogger(
    IntegrationPayinRouterService.name,
  );

  constructor(
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
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
        return this.paymentsService.createOnikPayin(
          createPayinTransactionDto,
          user,
        );

      case "FYNTRA":
        return this.paymentsService.createFyntraPayin(
          createPayinTransactionDto,
          user,
        );

      case "GEOPAY":
        // GeoPay uses a different DTO type, but we'll handle it
        return this.paymentsService.createGeoPayCheckout(
          createPayinTransactionDto as any,
          user,
        );

      case "UTKARSH":
        return this.paymentsService.createUtkarshPaymentLink(
          createPayinTransactionDto,
          user,
        );

      default:
        throw new BadRequestException(
          `Unsupported integration code: ${integrationCode}. Supported codes: ONIK, FYNTRA, GEOPAY, UTKARSH`,
        );
    }
  }
}
