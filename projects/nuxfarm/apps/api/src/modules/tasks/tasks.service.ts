import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  createTaskSchema,
  taskTimelineQuerySchema,
  updateTaskSchema,
} from "./tasks.schemas";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(farmId: string, query: Record<string, string | undefined>) {
    const parsed = taskTimelineQuerySchema.parse(query);
    const where: Prisma.TaskWhereInput = {
      farmId,
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.assigneeId ? { assigneeId: parsed.assigneeId } : {}),
      ...(parsed.cycleId ? { cycleId: parsed.cycleId } : {}),
    };
    return this.prisma.task.findMany({
      where,
      include: {
        location: true,
        cycle: true,
        assignee: true,
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: parsed.take,
    });
  }

  async get(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        farm: true,
        location: true,
        cycle: true,
        assignee: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found.`);
    }
    return task;
  }

  async create(
    farmId: string,
    input: z.infer<typeof createTaskSchema>,
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
    if (input.assigneeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.assigneeId },
      });
      if (!user) {
        throw new BadRequestException(
          `Assignee ${input.assigneeId} not found.`,
        );
      }
    }
    return this.prisma.task.create({
      data: { ...input, farmId },
    });
  }

  async update(id: string, input: z.infer<typeof updateTaskSchema>) {
    await this.get(id);
    return this.prisma.task.update({ where: { id }, data: input });
  }

  /**
   * Task timeline: every task on the farm whose start or due date falls
   * inside the requested window, ordered chronologically.
   */
  timeline(farmId: string, query: Record<string, string | undefined>) {
    const parsed = taskTimelineQuerySchema.parse(query);
    const where: Prisma.TaskWhereInput = {
      farmId,
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.assigneeId ? { assigneeId: parsed.assigneeId } : {}),
      ...(parsed.cycleId ? { cycleId: parsed.cycleId } : {}),
      ...(parsed.from || parsed.to
        ? {
            OR: [
              {
                dueDate: {
                  ...(parsed.from ? { gte: parsed.from } : {}),
                  ...(parsed.to ? { lte: parsed.to } : {}),
                },
              },
              {
                startDate: {
                  ...(parsed.from ? { gte: parsed.from } : {}),
                  ...(parsed.to ? { lte: parsed.to } : {}),
                },
              },
            ],
          }
        : {}),
    };
    return this.prisma.task.findMany({
      where,
      include: {
        location: true,
        cycle: true,
        assignee: true,
      },
      orderBy: [
        { startDate: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      take: parsed.take,
    });
  }
}
