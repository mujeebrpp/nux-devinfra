import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { uuidSchema } from "../../common/schemas/common.schemas";
import {
  createItemSchema,
  createTransactionSchema,
  updateItemSchema,
} from "./inventory.schemas";
import { InventoryService } from "./inventory.service";

@Controller("farms/:farmId/inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.inventory.list(farmId, query);
  }

  @Get("low-stock")
  lowStock(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
  ) {
    return this.inventory.lowStock(farmId);
  }

  @Post()
  create(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Body(new ZodValidationPipe(createItemSchema))
    input: Prisma.InventoryItemCreateInput,
  ) {
    return this.inventory.create(farmId, input);
  }

  @Get(":id")
  get(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.inventory.get(id);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateItemSchema))
    input: Prisma.InventoryItemUpdateInput,
  ) {
    return this.inventory.update(id, input);
  }

  @Post(":id/transactions")
  createTransaction(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(createTransactionSchema))
    input: {
      type: "IN" | "OUT" | "ADJUST";
      quantity: number;
      reference?: string | null;
      notes?: string | null;
    },
  ) {
    return this.inventory.createTransaction(id, input);
  }
}
