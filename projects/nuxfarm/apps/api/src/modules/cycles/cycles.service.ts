import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../../prisma/prisma.service";
import {
  createCycleSchema,
  createStageSchema,
  updateCycleSchema,
  updateStageSchema,
} from "./cycles.schemas";

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  list(farmId: string, status?: string) {
    return this.prisma.cropCycle.findMany({
      where: {
        farmId,
        ...(status ? { status } : {}),
      },
      include: { location: true, stages: { orderBy: { sequence: "asc" } } },
      orderBy: { startDate: "desc" },
    });
  }

  async get(id: string) {
    const cycle = await this.prisma.cropCycle.findUnique({
      where: { id },
      include: {
        location: true,
        farm: true,
        createdBy: true,
        stages: { orderBy: { sequence: "asc" } },
        tasks: { orderBy: { dueDate: "asc" } },
        irrigationLogs: { orderBy: { irrigatedAt: "desc" } },
      },
    });
    if (!cycle) {
      throw new NotFoundException(`Crop cycle ${id} not found.`);
    }
    return cycle;
  }

  async create(input: z.infer<typeof createCycleSchema>) {
    const location = await this.prisma.farmLocation.findUnique({
      where: { id: input.locationId },
    });
    if (!location) {
      throw new BadRequestException(
        `Location ${input.locationId} not found.`,
      );
    }
    if (input.createdById) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.createdById },
      });
      if (!user) {
        throw new BadRequestException(
          `User ${input.createdById} not found.`,
        );
      }
    }
    const data = {
      ...input,
      farmId: location.farmId,
    };
    return this.prisma.cropCycle.create({ data });
  }

  async update(id: string, input: z.infer<typeof updateCycleSchema>) {
    await this.get(id);
    return this.prisma.cropCycle.update({ where: { id }, data: input });
  }

  async createStage(
    cycleId: string,
    input: z.infer<typeof createStageSchema>,
  ) {
    await this.get(cycleId);
    return this.prisma.cycleStage.create({
      data: { ...input, cycleId },
    });
  }

  async updateStage(
    id: string,
    input: z.infer<typeof updateStageSchema>,
  ) {
    const stage = await this.prisma.cycleStage.findUnique({
      where: { id },
    });
    if (!stage) {
      throw new NotFoundException(`Stage ${id} not found.`);
    }
    return this.prisma.cycleStage.update({ where: { id }, data: input });
  }
}
