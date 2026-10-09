import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Full health check including a live database round-trip. */
  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }

  /** Lightweight liveness probe for orchestrators. */
  @Get("ready")
  getReadiness() {
    return this.healthService.getReadiness();
  }
}
