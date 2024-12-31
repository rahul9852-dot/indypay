import { ApiResponseProperty } from "@nestjs/swagger";

export class UserDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  fullName: string;
}

export class Collection {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  amount: number;

  @ApiResponseProperty()
  orderId: string;

  @ApiResponseProperty()
  name: string;

  @ApiResponseProperty()
  status: string;

  @ApiResponseProperty()
  txnRefId: string;

  @ApiResponseProperty()
  intent: string;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty({ type: UserDto })
  user: UserDto;
}

export class PaginationResponseDto {
  @ApiResponseProperty()
  total: number;

  @ApiResponseProperty()
  page: number;

  @ApiResponseProperty()
  limit: number;
}

export class GetTransactionsDetailsResponseDto {
  @ApiResponseProperty({ type: [Collection] })
  data: Collection[];

  @ApiResponseProperty({ type: PaginationResponseDto })
  pagination: PaginationResponseDto;
}
