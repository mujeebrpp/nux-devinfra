import { Controller, Get } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** Aggregate overview for the cafe dashboard. */
  @Get()
  getOverview() {
    return this.dashboardService.getOverview();
  }
}
