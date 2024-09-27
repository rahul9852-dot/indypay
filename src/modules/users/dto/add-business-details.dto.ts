import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  BUSINESS_ENTITY_TYPE,
  BUSINESS_INDUSTRIES,
  DESIGNATION,
  TURNOVER_TYPE,
} from "@/enums";

export class AddBusinessDetailsDto {
  @ApiProperty({
    enum: BUSINESS_ENTITY_TYPE,
  })
  @IsEnum(BUSINESS_ENTITY_TYPE)
  @IsNotEmpty()
  businessEntityType: BUSINESS_ENTITY_TYPE;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ enum: DESIGNATION })
  @IsEnum(DESIGNATION)
  @IsNotEmpty()
  designation: DESIGNATION;

  @ApiProperty({ enum: TURNOVER_TYPE })
  @IsEnum(TURNOVER_TYPE)
  @IsNotEmpty()
  turnover: TURNOVER_TYPE;

  @ApiProperty({ enum: BUSINESS_INDUSTRIES })
  @IsEnum(BUSINESS_INDUSTRIES)
  @IsNotEmpty()
  industry: BUSINESS_INDUSTRIES;
}
