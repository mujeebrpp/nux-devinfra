import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { uuidSchema } from "../../common/schemas/common.schemas";
import {
  generateReportSchema,
  GenerateReportInput,
  reportListQuerySchema,
} from "./reports.schemas";
import { ReportsService } from "./reports.service";

@Controller("farms/:farmId/reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  list(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    const parsed = reportListQuerySchema.parse(query);
    return this.reports.list(farmId, parsed.type, parsed.take);
  }

  @Post("generate")
  generate(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Body(new ZodValidationPipe(generateReportSchema))
    input: GenerateReportInput,
  ) {
    return this.reports.generate(farmId, input);
  }

  @Get(":id")
  get(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.reports.get(id);
  }
}
