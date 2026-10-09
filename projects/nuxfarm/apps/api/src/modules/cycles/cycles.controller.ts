import { z } from "zod";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { uuidSchema } from "../../common/schemas/common.schemas";
import {
  createCycleSchema,
  createStageSchema,
  updateCycleSchema,
  updateStageSchema,
} from "./cycles.schemas";
import { CyclesService } from "./cycles.service";

@Controller("farms/:farmId/cycles")
export class CyclesController {
  constructor(private readonly cycles: CyclesService) {}

  @Get()
  list(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query("status") status?: string,
  ) {
    return this.cycles.list(farmId, status);
  }

  @Post()
  create(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) _farmId: string,
    @Body(new ZodValidationPipe(createCycleSchema))
    input: z.infer<typeof createCycleSchema>,
  ) {
    return this.cycles.create(input);
  }

  @Get(":id")
  get(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.cycles.get(id);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateCycleSchema))
    input: z.infer<typeof updateCycleSchema>,
  ) {
    return this.cycles.update(id, input);
  }

  @Post(":cycleId/stages")
  createStage(
    @Param("cycleId", new ZodValidationPipe(uuidSchema)) cycleId: string,
    @Body(new ZodValidationPipe(createStageSchema))
    input: z.infer<typeof createStageSchema>,
  ) {
    return this.cycles.createStage(cycleId, input);
  }

  @Patch(":cycleId/stages/:stageId")
  updateStage(
    @Param("stageId", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateStageSchema))
    input: z.infer<typeof updateStageSchema>,
  ) {
    return this.cycles.updateStage(id, input);
  }
}
