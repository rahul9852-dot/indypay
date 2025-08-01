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
  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentDto)
  bankStatement: DocumentDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentDto)
  addressProof: DocumentDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentDto)
  companyPan: DocumentDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentDto)
  companyCheque: DocumentDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentDto)
  moa: DocumentDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentDto)
  aoa: DocumentDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentDto)
  coi: DocumentDto;
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

export class DirectorInfoDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  din: string;

  @ApiProperty()
  @IsString()
  pan: string;

  @ApiProperty()
  @IsString()
  aadharNumber: string;

  @ApiProperty({ type: DocumentDto })
  @IsOptional()
  panCardDoc?: DocumentDto;

  @ApiProperty({ type: DocumentDto })
  @IsOptional()
  aadharCardDoc?: DocumentDto;
}

export class KybInfoDto {
  @ApiProperty({ type: [DirectorInfoDto] })
  @ValidateNested({ each: true })
  @Type(() => DirectorInfoDto)
  directors: DirectorInfoDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  websiteUrl: string;
}
export class KycSubmissionDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  @IsObject()
  personalInfo: PersonalInfoDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => BusinessStructureDto)
  @IsObject()
  businessStructure: BusinessStructureDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => KybInfoDto)
  @IsObject()
  kybInfo: KybInfoDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DocumentsDto)
  @IsObject()
  documents: DocumentsDto;
}
