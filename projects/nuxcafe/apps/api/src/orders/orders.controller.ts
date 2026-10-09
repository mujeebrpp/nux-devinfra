import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** List orders with status filter and pagination. */
  @Get()
  list(@Query() query: OrderQueryDto) {
    return this.ordersService.list(query);
  }

  /** Get an order by id, including lines, production runs and sale. */
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.ordersService.findById(id);
  }

  /**
   * Place an order. Creates the order plus a queued kitchen
   * production run per line.
   */
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  /** Complete an order: consumes stock and records the sale. */
  @HttpCode(200)
  @Post(":id/complete")
  complete(@Param("id") id: string) {
    return this.ordersService.complete(id);
  }

  /** Cancel an order and its active production runs. */
  @HttpCode(200)
  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.ordersService.cancel(id);
  }
}
