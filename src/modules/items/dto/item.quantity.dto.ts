import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, IsString } from "class-validator";

export class ItemQuantityDto {
  @ApiProperty({
    description: "Item ID",
    type: String,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: "Quantity of the item",
    type: Number,
  })
  @IsInt()
  @IsPositive()
  quantity: number;
}
