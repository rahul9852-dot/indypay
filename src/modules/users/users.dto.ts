import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import {
  ACCOUNT_STATUS,
  BUSINESS_ENTITY_TYPE,
  BUSINESS_INDUSTRIES,
  DESIGNATION,
  ONBOARDING_STATUS,
  TURNOVER_TYPE,
  USERS_ROLE,
} from "@/enums";

export class CreateUserDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  fullName: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: "9120050070" })
  @IsPhoneNumber("IN", {
    always: true,
  })
  mobile: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isKycVerified?: boolean;

  @ApiPropertyOptional({ example: ACCOUNT_STATUS.ACTIVE })
  @IsEnum(ACCOUNT_STATUS)
  @IsOptional()
  status?: ACCOUNT_STATUS;

  @ApiPropertyOptional({ example: USERS_ROLE.MERCHANT })
  @IsEnum(USERS_ROLE)
  @IsOptional()
  role?: USERS_ROLE;

  @ApiPropertyOptional({ example: ONBOARDING_STATUS.KYC_VERIFIED })
  @IsEnum(ONBOARDING_STATUS)
  @IsOptional()
  onboardingStatus?: ONBOARDING_STATUS;

  @ApiPropertyOptional({ example: "address" })
  @IsString()
  @IsOptional()
  @Length(5, 250)
  address?: string;

  @ApiPropertyOptional({ example: "city" })
  @IsString()
  @IsOptional()
  @Length(5, 100)
  city?: string;

  @ApiPropertyOptional({ example: "state" })
  @IsString()
  @IsOptional()
  @Length(5, 100)
  state?: string;

  @ApiPropertyOptional({ example: "pincode" })
  @IsString()
  @IsOptional()
  @Length(6, 6)
  pincode?: string;

  @ApiPropertyOptional({ example: "aadhar" })
  @IsString()
  @IsOptional()
  @Length(12, 12)
  aadhar?: string;

  @ApiPropertyOptional({ example: "pan" })
  @IsString()
  @IsOptional()
  @Length(10, 10)
  pan?: string;

  @ApiPropertyOptional({ example: DESIGNATION.MANAGER })
  @IsEnum(DESIGNATION)
  @IsOptional()
  designation?: DESIGNATION;

  @ApiPropertyOptional({ example: "https://paybolt.in/icon.png" })
  @IsString()
  @IsOptional()
  @Length(5, 250)
  image?: string;
}

export class UpdateBusinessDetailsDto {
  @ApiProperty({ example: "usr_12345" })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: BUSINESS_ENTITY_TYPE.FREELANCE })
  @IsEnum(BUSINESS_ENTITY_TYPE)
  businessEntityType: BUSINESS_ENTITY_TYPE;

  @ApiProperty({ example: BUSINESS_INDUSTRIES.AGRICULTURE })
  @IsEnum(BUSINESS_INDUSTRIES)
  industry: BUSINESS_INDUSTRIES;

  @ApiProperty({ example: TURNOVER_TYPE.TWENTY_FIVE_TO_FIFTY_LAC })
  @IsEnum(TURNOVER_TYPE)
  turnover: TURNOVER_TYPE;
}
