import { SetMetadata } from "@nestjs/common";
import { ROLES_KEY } from "@/constants/auth.constant";
import { USERS_ROLE } from "@/enums";

export const Role = (...roles: USERS_ROLE[]) => SetMetadata(ROLES_KEY, roles);
