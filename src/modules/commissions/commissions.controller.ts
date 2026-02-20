import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CommissionService } from "./commission.service";
import { CreateCommissionDto } from "./dto/create-commission.dto";
import { UpdateCommissionDto } from "./dto/update-commission.dto";
import { CreateCommissionSlabDto } from "./dto/create-commission-slab.dto";
import { UpdateCommissionSlabDto } from "./dto/update-commission-slab.dto";
import { AssignCommissionToUserDto } from "./dto/assign-commission-to-user.dto";
import { USERS_ROLE } from "@/enums";
import { Role } from "@/decorators/role.decorator";
import { AuthGuard } from "@/guard/auth.guard";

@ApiTags("Commissions")
@Controller("commissions")
@UseGuards(AuthGuard)
export class CommissionsController {
  constructor(private readonly commissionService: CommissionService) {}

  // Commission Plan CRUD (Admin/Ops only)
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Create a new commission plan" })
  @Post()
  async createCommission(@Body() createDto: CreateCommissionDto) {
    return this.commissionService.createCommission(createDto);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Get all commission plans" })
  @ApiOkResponse({ description: "List of all commission plans with slabs" })
  @Get()
  async getAllCommissions() {
    return this.commissionService.getAllCommissions();
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Get user's commission mapping" })
  @Get("users/:userId")
  async getUserCommission(@Param("userId") userId: string) {
    return this.commissionService.getUserCommissionMapping(userId);
  }

  // Commission Slab CRUD (must be before :id routes so slabs/:slabId is matched)
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Add slab to commission plan" })
  @Post(":commissionId/slabs")
  async addSlab(
    @Param("commissionId") commissionId: string,
    @Body() createSlabDto: CreateCommissionSlabDto,
  ) {
    return this.commissionService.addSlab(commissionId, createSlabDto);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Update commission slab" })
  @Put("slabs/:slabId")
  async updateSlab(
    @Param("slabId") slabId: string,
    @Body() updateSlabDto: UpdateCommissionSlabDto,
  ) {
    return this.commissionService.updateSlab(slabId, updateSlabDto);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Delete commission slab" })
  @Delete("slabs/:slabId")
  async deleteSlab(@Param("slabId") slabId: string) {
    return this.commissionService.deleteSlab(slabId);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Get commission plan by ID" })
  @ApiOkResponse({ description: "Commission plan with slabs" })
  @Get(":id")
  async getCommissionById(@Param("id") id: string) {
    return this.commissionService.getCommissionById(id);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Update commission plan" })
  @Put(":id")
  async updateCommission(
    @Param("id") id: string,
    @Body() updateDto: UpdateCommissionDto,
  ) {
    return this.commissionService.updateCommission(id, updateDto);
  }

  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Delete commission plan" })
  @Delete(":id")
  async deleteCommission(@Param("id") id: string) {
    return this.commissionService.deleteCommission(id);
  }

  // User Commission Assignment
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  @ApiOperation({ summary: "Assign commission plan to user" })
  @Post("users/:userId/assign")
  async assignCommissionToUser(
    @Param("userId") userId: string,
    @Body() assignDto: AssignCommissionToUserDto,
  ) {
    return this.commissionService.assignCommissionToUser(userId, assignDto);
  }
}
