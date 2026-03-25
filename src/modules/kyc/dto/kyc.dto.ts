import {
  IsString,
  IsEnum,
  ValidateNested,
  IsObject,
  IsNotEmpty,
  IsOptional,
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
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  bankStatement?: DocumentDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  addressProof?: DocumentDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  companyPan?: DocumentDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  companyCheque?: DocumentDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  moa?: DocumentDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  aoa?: DocumentDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDto)
  coi?: DocumentDto;
}

export class PersonalInfoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  personalPanNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: DESIGNATION, required: false })
  @IsOptional()
  @IsEnum(DESIGNATION)
  designation?: string;
}

export class BusinessStructureDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  registeredBusinessNumber?: string;

  @ApiProperty({ enum: BUSINESS_ENTITY_TYPE, required: false })
  @IsOptional()
  @IsEnum(BUSINESS_ENTITY_TYPE)
  @Type(() => Number)
  @IsPositive()
  typeOfBusiness?: number;

  @ApiProperty({ enum: BUSINESS_INDUSTRIES, required: false })
  @IsOptional()
  @IsEnum(BUSINESS_INDUSTRIES)
  industryName?: string;

  @ApiProperty({ enum: TURNOVER_TYPE, required: false })
  @IsOptional()
  @IsEnum(TURNOVER_TYPE)
  turnover?: number;
}

export class DirectorInfoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  din?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  aadharNumber?: string;

  @ApiProperty({ type: DocumentDto, required: false })
  @IsOptional()
  panCardDoc?: DocumentDto;

  @ApiProperty({ type: DocumentDto, required: false })
  @IsOptional()
  aadharCardDoc?: DocumentDto;
}

export class KybInfoDto {
  @ApiProperty({ type: [DirectorInfoDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DirectorInfoDto)
  directors?: DirectorInfoDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  websiteUrl?: string;
}

export class KycSubmissionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  @IsObject()
  personalInfo?: PersonalInfoDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessStructureDto)
  @IsObject()
  businessStructure?: BusinessStructureDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => KybInfoDto)
  @IsObject()
  kybInfo?: KybInfoDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentsDto)
  @IsObject()
  documents?: DocumentsDto;
}
