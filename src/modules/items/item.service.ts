import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { CreateItemDto } from "./dto/create-item.dto";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto, PaginationWithDateDto } from "@/dtos/common.dto";
import { ItemEntity } from "@/entities/item.entity";
import { getPagination } from "@/utils/pagination.utils";

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,
  ) {}

  async createItem(createItemDto: CreateItemDto, merchant: UsersEntity) {
    createItemDto.name = createItemDto.name.toLowerCase();

    const existingItem = await this.itemRepo.findOne({
      where: { name: createItemDto.name, merchantId: merchant.id },
    });

    if (existingItem) {
      throw new ConflictException("Item with this name already exists.");
    }

    const item = this.itemRepo.create({
      ...createItemDto,
      merchant,
    });

    await this.itemRepo.save(item);

    return new MessageResponseDto("Item created successfully.");
  }

  async getAllItemsForMerchant(
    {
      limit = 10,
      page = 1,
      search = "",
      sort = "id",
      order = "DESC",
      startDate,
      endDate,
    }: PaginationWithDateDto,
    merchant: UsersEntity,
  ) {
    const whereQuery:
      | FindOptionsWhere<ItemEntity>
      | FindOptionsWhere<ItemEntity>[] = {};

    // Date Filter
    if (startDate && endDate) {
      whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const query = [
      {
        ...whereQuery,
        merchantId: merchant.id,
      },
    ];

    if (search) {
      query.push({
        name: ILike(`%${search}%`),
        merchantId: merchant.id,
      });
      query.push({
        description: ILike(`%${search}%`),
        merchantId: merchant.id,
      });
      query.push({
        id: ILike(`%${search}%`),
        merchantId: merchant.id,
      });
    }

    const [data, totalItems] = await this.itemRepo.findAndCount({
      where: query,
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        merchant: true,
      },
      order: {
        [sort]: order,
      },
      select: {
        id: true,
        name: true,
        description: true,
        merchantId: true,
        price: true,
        merchant: {
          id: true,
          fullName: true,
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    const pagination = getPagination({
      totalItems,
      limit,
      page,
    });

    return {
      data,
      pagination,
    };
  }

  async getItemById(itemId: string, merchant: UsersEntity) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, merchant: { id: merchant.id } },
      select: {
        id: true,
        name: true,
        description: true,
        merchantId: true,
        merchant: {
          id: true,
          fullName: true,
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!item) {
      throw new NotFoundException("Item not found.");
    }

    return item;
  }

  async deleteItem(itemId: string, merchant: UsersEntity) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, merchant: { id: merchant.id } },
      relations: {
        merchant: true,
      },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    await this.itemRepo.delete({
      id: itemId,
      merchant: { id: merchant.id },
    });

    return { message: "Item deleted successfully" };
  }
}
