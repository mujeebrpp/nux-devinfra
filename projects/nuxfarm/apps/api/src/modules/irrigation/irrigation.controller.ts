import {
  Body,
  Controller,
  Delete,
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
  createIrrigationLogSchema,
  updateIrrigationLogSchema,
} from "./irrigation.schemas";
import { IrrigationService } from "./irrigation.service";

@Controller("farms/:farmId/irrigation")
export class IrrigationController {
  constructor(private readonly irrigation: IrrigationService) {}

  @Get()
  list(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.irrigation.list(farmId, query);
  }

  @Get("summary")
  summary(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.irrigation.summary(farmId, query);
  }

  @Post()
  create(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Body(new ZodValidationPipe(createIrrigationLogSchema))
    input: Prisma.IrrigationLogCreateInput,
  ) {
    return this.irrigation.create(farmId, input);
  }

  @Get(":id")
  get(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.irrigation.get(id);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateIrrigationLogSchema))
    input: Prisma.IrrigationLogUpdateInput,
  ) {
    return this.irrigation.update(id, input);
  }

  @Delete(":id")
  remove(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.irrigation.remove(id);
  }
}
