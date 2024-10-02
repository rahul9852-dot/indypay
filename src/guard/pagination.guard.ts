import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class PaginationGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const { query } = request;

    const limit = Number(query.limit || 10);

    if (limit > 100) {
      throw new BadRequestException("Limit cannot be greater than 100");
    }

    return true;
  }
}
