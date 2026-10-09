import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CreateProductionDto } from "./dto/create-production.dto";
import { ProductionQueryDto } from "./dto/production-query.dto";
import { ProductionService } from "./production.service";

@Controller("production")
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  /** List production runs with status and menu item filters. */
  @Get()
  list(@Query() query: ProductionQueryDto) {
    return this.productionService.list(query);
  }

  /** Get a single production run. */
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.productionService.findById(id);
  }

  /** Queue a manual production run. */
  @Post()
  create(@Body() dto: CreateProductionDto) {
    return this.productionService.create(dto);
  }

  /** Start a queued production run. */
  @HttpCode(200)
  @Post(":id/start")
  start(@Param("id") id: string) {
    return this.productionService.start(id);
  }

  /** Complete a production run. */
  @HttpCode(200)
  @Post(":id/complete")
  complete(@Param("id") id: string) {
    return this.productionService.complete(id);
  }

  /** Cancel a production run. */
  @HttpCode(200)
  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.productionService.cancel(id);
  }
}
