import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import { DESIGNATION, OAUTH_PROVIDER } from "@/enums";
import { CreateUserDto } from "@/modules/users/users.dto";

export class RegisterUserDto extends CreateUserDto {
  @ApiProperty({ example: DESIGNATION.OWNER })
  @IsEnum(DESIGNATION)
  designation: DESIGNATION;

  @ApiProperty({ example: "PayBolt Tech" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  businessName: string;
}

export class LoginUserDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code2FA: string;
}

export class SendMagicLinkOnWhatsappDto {
  @ApiProperty({ example: "9988776655" })
  @IsPhoneNumber("IN")
  mobile: string;
}
export class OAuthProviderDto {
  @ApiProperty({
    example: OAUTH_PROVIDER.GOOGLE,
    enum: [OAUTH_PROVIDER.GOOGLE, OAUTH_PROVIDER.MICROSOFT],
  })
  @IsEnum(OAUTH_PROVIDER)
  provider: OAUTH_PROVIDER;
}

export class OAuthVerifyTokenDto {
  @ApiProperty({ example: "token" })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class OAuthGoogleTokenDataResponseDto {
  @ApiResponseProperty()
  @IsString()
  email: string;

  @ApiResponseProperty()
  @IsString()
  emailVerified: string;

  @ApiResponseProperty()
  @IsString()
  fullName: string;

  @ApiResponseProperty()
  @IsString()
  image: string;

  @ApiResponseProperty()
  is2FAEnabled: boolean;
}

export class RegisterUserResponseDto {
  @ApiResponseProperty()
  userId: string;
}
