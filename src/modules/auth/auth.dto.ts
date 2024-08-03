import { Response } from "express";
import { IRefreshTokenPayload } from "interface/common.interface";
import { CreateMerchantDto } from "modules/merchants/merchants.dto";

export class RegisterMerchantDto extends CreateMerchantDto {}

export class RefreshDto {
  user: IRefreshTokenPayload;
  response: Response;
}
