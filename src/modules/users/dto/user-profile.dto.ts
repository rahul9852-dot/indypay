import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import {
  ACCOUNT_STATUS,
  KYC_STATUS,
  ONBOARDING_STATUS,
  USERS_ROLE,
} from "@/enums";

export class UserProfileResDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  fullName: string;

  @ApiResponseProperty()
  email: string;

  @ApiResponseProperty()
  mobile: string;

  @ApiResponseProperty()
  kycStatus: KYC_STATUS;

  @ApiResponseProperty()
  accountStatus: ACCOUNT_STATUS;

  @ApiResponseProperty()
  role: USERS_ROLE;

  @ApiResponseProperty()
  onboardingStatus: ONBOARDING_STATUS;

  @ApiResponseProperty()
  image?: string;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty()
  updatedAt: Date;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
