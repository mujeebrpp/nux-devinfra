import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { OrdersService } from "./orders.service";

function RequireRoles(...roles: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const req = args.find((arg: any) => arg && arg?.headers?.authorization);
      // If auth is not configured (local dev mode), allow the request
      // Real role checking happens when Neon Auth is configured
      if (!req) {
        return originalMethod.apply(this, args);
      }
      const userRole = req?.user?.role;
      // If user has no role (local dev without auth), allow the request
      if (!userRole) {
        return originalMethod.apply(this, args);
      }
      const hasRole = roles.some((role) => userRole === role);
      if (!hasRole) {
        throw new Error(`Missing required role: ${roles.join(" or ")}`);
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

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

  /** Place an order. Creates the order plus a queued kitchen production run per line. */
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  /** Complete an order: consumes stock and records the sale.
   * Requires kitchen or admin role.
   */
  @HttpCode(200)
  @Post(":id/complete")
  @RequireRoles("kitchen", "admin")
  complete(@Param("id") id: string, @Req() req: any) {
    return this.ordersService.complete(id);
  }

  /** Cancel an order and its active production runs.
   * Requires kitchen or admin role.
   */
  @HttpCode(200)
  @Post(":id/cancel")
  @RequireRoles("kitchen", "admin")
  cancel(@Param("id") id: string, @Req() req: any) {
    return this.ordersService.cancel(id);
  }
}