import { SetMetadata } from "@nestjs/common";
import { DISABLED_ENDPOINT_KEY } from "@/constants/auth.constant";

export const DisabledEndpoint = () => SetMetadata(DISABLED_ENDPOINT_KEY, true);
