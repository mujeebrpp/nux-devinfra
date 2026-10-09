import { Controller, Get, Query } from "@nestjs/common";
import { SaleQueryDto } from "./dto/sale-query.dto";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /** Revenue summary: today and the rolling 7-day breakdown. */
  @Get("summary")
  getSummary() {
    return this.salesService.getSummary();
  }

  /** Recent sales, newest first. */
  @Get()
  list(@Query() query: SaleQueryDto) {
    return this.salesService.list(query);
  }
}
