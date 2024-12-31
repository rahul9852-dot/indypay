import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { PaginationDto } from "@/dtos/common.dto";

export class UserResponseDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  fullName: string;

  @ApiResponseProperty()
  email: string;

  @ApiResponseProperty()
  mobile: string;

  @ApiResponseProperty()
  accountStatus: number;

  @ApiResponseProperty()
  role: number;

  @ApiResponseProperty()
  onboardingStatus: number;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty()
  updatedAt: Date;
}

export class PaginationResponseDto {
  @ApiResponseProperty()
  total: number;

  @ApiResponseProperty()
  page: number;

  @ApiResponseProperty()
  limit: number;
}
export class UserListResponseDto {
  @ApiResponseProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiResponseProperty({ type: PaginationResponseDto })
  pagination: PaginationResponseDto;
}

export class UserListQuery extends PaginationDto {
  @ApiProperty({
    enum: ["merchant", "ops", "cp"],
  })
  @IsEnum(["merchant", "ops", "cp"])
  role: "merchant" | "ops" | "cp";
}
