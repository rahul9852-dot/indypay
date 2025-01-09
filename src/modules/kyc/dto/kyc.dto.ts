import {
  IsString,
  IsEnum,
  ValidateNested,
  IsObject,
  IsNotEmpty,
  IsEmail,
  IsPositive,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import {
  BUSINESS_ENTITY_TYPE,
  DESIGNATION,
  TURNOVER_TYPE,
  BUSINESS_INDUSTRIES,
} from "@/enums";

export class DocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  docType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class DocumentsDto {
  @ValidateNested()
  @Type(() => DocumentDto)
  panCard: DocumentDto;

  @ValidateNested()
  @Type(() => DocumentDto)
  aadharNumber: DocumentDto;

  @ValidateNested()
  @Type(() => DocumentDto)
  bankStatement: DocumentDto;

  @ValidateNested()
  @Type(() => DocumentDto)
  addressProof: DocumentDto;
}

export class PersonalInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  personalPanNumber: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: DESIGNATION })
  @IsEnum(DESIGNATION)
  @IsNotEmpty()
  designation: string;
}

export class BusinessStructureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registeredBusinessNumber: string;

  @ApiProperty({ enum: BUSINESS_ENTITY_TYPE })
  @IsEnum(BUSINESS_ENTITY_TYPE)
  @Type(() => Number)
  @IsPositive()
  typeOfBusiness: number;

  @ApiProperty({ enum: BUSINESS_INDUSTRIES })
  @IsEnum(BUSINESS_INDUSTRIES)
  @IsPositive()
  industryName: string;

  @ApiProperty({ enum: TURNOVER_TYPE })
  @IsEnum(TURNOVER_TYPE)
  @IsPositive()
  turnover: number;
}

export class KycSubmissionDto {
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  @IsObject()
  personalInfo: PersonalInfoDto;

  @ValidateNested()
  @Type(() => BusinessStructureDto)
  @IsObject()
  businessStructure: BusinessStructureDto;

  @ValidateNested()
  @Type(() => DocumentsDto)
  @IsObject()
  documents: DocumentsDto;
}
