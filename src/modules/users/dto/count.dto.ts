import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class UpdateCountDto {
  @IsString()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @Min(0)
  count: number;
}
