import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  createIrrigationLogSchema,
  irrigationQuerySchema,
  updateIrrigationLogSchema,
} from "./irrigation.schemas";

@Injectable()
export class IrrigationService {
  constructor(private readonly prisma: PrismaService) {}

  list(farmId: string, query: Record<string, string | undefined>) {
    const parsed = irrigationQuerySchema.parse(query);
    const where: Prisma.IrrigationLogWhereInput = {
      farmId,
      ...(parsed.method ? { method: parsed.method } : {}),
      ...(parsed.cycleId ? { cycleId: parsed.cycleId } : {}),
      ...(parsed.locationId ? { locationId: parsed.locationId } : {}),
      ...(parsed.from || parsed.to
        ? {
            irrigatedAt: {
              ...(parsed.from ? { gte: parsed.from } : {}),
              ...(parsed.to ? { lte: parsed.to } : {}),
            },
          }
        : {}),
    };
    return this.prisma.irrigationLog.findMany({
      where,
      include: { location: true, cycle: true },
      orderBy: { irrigatedAt: "desc" },
      take: parsed.take,
    });
  }

  async get(id: string) {
    const log = await this.prisma.irrigationLog.findUnique({
      where: { id },
      include: { farm: true, location: true, cycle: true },
    });
    if (!log) {
      throw new NotFoundException(`Irrigation log ${id} not found.`);
    }
    return log;
  }

  async create(
    farmId: string,
    input: z.infer<typeof createIrrigationLogSchema>,
  ) {
    if (input.locationId) {
      const location = await this.prisma.farmLocation.findUnique({
        where: { id: input.locationId },
      });
      if (!location || location.farmId !== farmId) {
        throw new BadRequestException(
          `Location ${input.locationId} not found on this farm.`,
        );
      }
    }
    if (input.cycleId) {
      const cycle = await this.prisma.cropCycle.findUnique({
        where: { id: input.cycleId },
      });
      if (!cycle || cycle.farmId !== farmId) {
        throw new BadRequestException(
          `Cycle ${input.cycleId} not found on this farm.`,
        );
      }
    }
    return this.prisma.irrigationLog.create({
      data: { ...input, farmId },
    });
  }

  async update(
    id: string,
    input: z.infer<typeof updateIrrigationLogSchema>,
  ) {
    await this.get(id);
    return this.prisma.irrigationLog.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.get(id);
    return this.prisma.irrigationLog.delete({ where: { id } });
  }

  /** Totals grouped by method for the requested window. */
  async summary(farmId: string, query: Record<string, string | undefined>) {
    const parsed = irrigationQuerySchema.parse(query);
    const where: Prisma.IrrigationLogWhereInput = {
      farmId,
      ...(parsed.from || parsed.to
        ? {
            irrigatedAt: {
              ...(parsed.from ? { gte: parsed.from } : {}),
              ...(parsed.to ? { lte: parsed.to } : {}),
            },
          }
        : {}),
    };
    const logs = await this.prisma.irrigationLog.findMany({ where });
    const byMethod = new Map<string, { count: number; minutes: number; liters: number }>();
    for (const log of logs) {
      const entry = byMethod.get(log.method) ?? {
        count: 0,
        minutes: 0,
        liters: 0,
      };
      entry.count += 1;
      entry.minutes += log.durationMinutes ?? 0;
      entry.liters += log.volumeLiters ?? 0;
      byMethod.set(log.method, entry);
    }
    return {
      totalEvents: logs.length,
      totalMinutes: logs.reduce((sum, log) => sum + (log.durationMinutes ?? 0), 0),
      totalLiters: logs.reduce((sum, log) => sum + (log.volumeLiters ?? 0), 0),
      byMethod: Object.fromEntries(byMethod),
    };
  }
}
