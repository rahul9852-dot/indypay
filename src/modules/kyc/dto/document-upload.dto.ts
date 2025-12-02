import { IsString, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DocumentUploadDto {
  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  fileType: string;

  @ApiProperty()
  @IsString()
  @IsIn([
    "panCard",
    "aadharNumber",
    "bankStatement",
    "addressProof",
    "companyPan",
    "companyCheque",
    "moa",
    "aoa",
    "coi",
    "gstinCertificate",
  ])
  documentType: string;
}
