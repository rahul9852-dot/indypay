import { Module, Global } from "@nestjs/common";
import { CacheMonitorService } from "./cache-monitor.service";

@Global()
@Module({
  providers: [CacheMonitorService],
  exports: [CacheMonitorService],
})
export class CacheMonitorModule {}
