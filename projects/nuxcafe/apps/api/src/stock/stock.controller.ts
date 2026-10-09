import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto";
import { StockMovementQueryDto } from "./dto/stock-movement-query.dto";
import { StockService } from "./stock.service";

@Controller("stock")
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /** Current stock levels for every active ingredient. */
  @Get("levels")
  getLevels() {
    return this.stockService.getLevels();
  }

  /** Paginated stock movement log. */
  @Get("movements")
  listMovements(@Query() query: StockMovementQueryDto) {
    return this.stockService.listMovements(query);
  }

  /** Record a purchase, usage, waste or adjustment. */
  @Post("movements")
  createMovement(@Body() dto: CreateStockMovementDto) {
    return this.stockService.createMovement(dto);
  }
}
