import { IsString, IsEnum, ValidateNested, IsObject } from "class-validator";
import { Type } from "class-transformer";
import {
  BUSINESS_ENTITY_TYPE,
  DESIGNATION,
  TURNOVER_TYPE,
  BUSINESS_INDUSTRIES,
} from "@/enums";

export class DocumentDto {
  @IsString()
  url: string;

  @IsString()
  docType: string;

  @IsString()
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
  @IsString()
  personalPanNumber: string;

  @IsString()
  email: string;

  @IsEnum(DESIGNATION)
  designation: string;
}

export class BusinessStructureDto {
  @IsString()
  businessName: string;

  @IsString()
  registeredBusinessNumber: string;

  @IsEnum(BUSINESS_ENTITY_TYPE)
  @Type(() => Number)
  typeOfBusiness: number;

  @IsEnum(BUSINESS_INDUSTRIES)
  @Type(() => Number)
  industryName: string;

  @IsEnum(TURNOVER_TYPE)
  @Type(() => Number)
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
