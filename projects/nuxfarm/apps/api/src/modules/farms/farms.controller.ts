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
  createFarmSchema,
  createLocationSchema,
  updateFarmSchema,
  updateLocationSchema,
} from "./farms.schemas";
import { FarmsService } from "./farms.service";

@Controller("farms")
export class FarmsController {
  constructor(private readonly farms: FarmsService) {}

  @Get()
  list(@Query("includeInactive") includeInactive?: string) {
    return this.farms.list(includeInactive !== "true");
  }

  @Post()
  create(@Body(new ZodValidationPipe(createFarmSchema)) input: Prisma.FarmCreateInput) {
    return this.farms.create(input);
  }

  @Get(":id")
  get(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.farms.get(id);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateFarmSchema)) input: Prisma.FarmUpdateInput,
  ) {
    return this.farms.update(id, input);
  }

  @Post(":farmId/locations")
  createLocation(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Body(new ZodValidationPipe(createLocationSchema))
    input: Prisma.FarmLocationCreateInput,
  ) {
    return this.farms.createLocation(farmId, input);
  }

  @Get(":farmId/locations")
  listLocations(
    @Param("farmId", new ZodValidationPipe(uuidSchema)) farmId: string,
    @Query("includeInactive") includeInactive?: string,
  ) {
    return this.farms.listLocations(farmId, includeInactive === "true");
  }

  @Get("locations/:id")
  getLocation(@Param("id", new ZodValidationPipe(uuidSchema)) id: string) {
    return this.farms.getLocation(id);
  }

  @Patch("locations/:id")
  updateLocation(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateLocationSchema))
    input: Prisma.FarmLocationUpdateInput,
  ) {
    return this.farms.updateLocation(id, input);
  }
}
