import { ApiResponseProperty } from "@nestjs/swagger";

export class ValidationErrorDto {
  @ApiResponseProperty({ example: ["email must be an email"] })
  message: string[];

  @ApiResponseProperty({ example: 400 })
  statusCode: number;

  @ApiResponseProperty({ example: "Bad Request" })
  error: string;
}

export class MessageResponseDto {
  constructor(message: string) {
    this.message = message;
  }
  @ApiResponseProperty()
  message: string;
}
