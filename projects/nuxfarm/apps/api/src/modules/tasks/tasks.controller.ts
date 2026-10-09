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
import { createTaskSchema, updateTaskSchema } from "./tasks.schemas";
import { TasksService } from "./tasks.service";

@Controller("farms/:farmId/tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.tasks.list(farmId, query);
  }

  @Get("timeline")
  timeline(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.tasks.timeline(farmId, query);
  }

  @Post()
  create(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Body(new ZodValidationPipe(createTaskSchema))
    input: Prisma.TaskCreateInput,
  ) {
    return this.tasks.create(farmId, input);
  }

  @Get(":id")
  get(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.tasks.get(id);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateTaskSchema))
    input: Prisma.TaskUpdateInput,
  ) {
    return this.tasks.update(id, input);
  }
}
