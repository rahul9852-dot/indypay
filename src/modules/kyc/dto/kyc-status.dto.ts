import { ApiResponseProperty } from "@nestjs/swagger";
import { KYC_STATUS } from "@/enums";

export class KycStatusResDto {
  @ApiResponseProperty()
  userId: string;

  @ApiResponseProperty()
  kycStatus: KYC_STATUS;
}
