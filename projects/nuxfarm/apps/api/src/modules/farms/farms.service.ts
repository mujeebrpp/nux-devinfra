import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  createFarmSchema,
  createLocationSchema,
  updateFarmSchema,
  updateLocationSchema,
} from "./farms.schemas";

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.farm.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async get(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: { locations: { orderBy: { code: "asc" } } },
    });
    if (!farm) {
      throw new NotFoundException(`Farm ${id} not found.`);
    }
    return farm;
  }

  async create(input: z.infer<typeof createFarmSchema>) {
    const existing = await this.prisma.farm.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new BadRequestException(
        `A farm with code "${input.code}" already exists.`,
      );
    }
    return this.prisma.farm.create({ data: input });
  }

  async update(id: string, input: z.infer<typeof updateFarmSchema>) {
    await this.get(id);
    return this.prisma.farm.update({ where: { id }, data: input });
  }

  async createLocation(
    farmId: string,
    input: z.infer<typeof createLocationSchema>,
  ) {
    await this.get(farmId);
    try {
      return await this.prisma.farmLocation.create({
        data: { ...input, farmId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(
          `Location code "${input.code}" already exists on this farm.`,
        );
      }
      throw error;
    }
  }

  listLocations(farmId: string, includeInactive = false) {
    return this.prisma.farmLocation.findMany({
      where: { farmId, ...(includeInactive ? {} : { active: true }) },
      orderBy: { code: "asc" },
    });
  }

  async getLocation(id: string) {
    const location = await this.prisma.farmLocation.findUnique({
      where: { id },
      include: { farm: true },
    });
    if (!location) {
      throw new NotFoundException(`Location ${id} not found.`);
    }
    return location;
  }

  async updateLocation(
    id: string,
    input: z.infer<typeof updateLocationSchema>,
  ) {
    await this.getLocation(id);
    return this.prisma.farmLocation.update({ where: { id }, data: input });
  }
}
