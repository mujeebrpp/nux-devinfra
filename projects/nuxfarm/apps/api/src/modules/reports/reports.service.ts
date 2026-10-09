import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GenerateReportInput } from "./reports.schemas";

interface Period {
  start?: Date;
  end?: Date;
}

type PeriodField =
  | "startDate"
  | "dueDate"
  | "irrigatedAt"
  | "transactionAt"
  | "generatedAt";

function periodWhere(
  field: PeriodField,
  period: Period,
): Record<string, unknown> {
  if (!period.start && !period.end) {
    return {};
  }
  return {
    [field]: {
      ...(period.start ? { gte: period.start } : {}),
      ...(period.end ? { lte: period.end } : {}),
    },
  };
}

function countBy<T>(rows: T[], keyOf: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(farmId: string, type?: string, take = 50) {
    return this.prisma.report.findMany({
      where: {
        farmId,
        ...(type ? { type } : {}),
      },
      include: { generatedBy: true },
      orderBy: { generatedAt: "desc" },
      take,
    });
  }

  async get(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { farm: true, generatedBy: true },
    });
    if (!report) {
      throw new NotFoundException(`Report ${id} not found.`);
    }
    return report;
  }

  /**
   * Computes the aggregate for the requested type, stores it as a
   * persisted report row and returns the stored record.
   */
  async generate(
    farmId: string,
    input: GenerateReportInput,
    generatedById?: string,
  ) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
    });
    if (!farm) {
      throw new BadRequestException(`Farm ${farmId} not found.`);
    }

    const period: Period = {
      ...(input.periodStart ? { start: input.periodStart } : {}),
      ...(input.periodEnd ? { end: input.periodEnd } : {}),
    };

    const data = await this.compute(farmId, input.type, period);

    return this.prisma.report.create({
      data: {
        farmId,
        type: input.type,
        title: input.title,
        periodStart: input.periodStart ?? null,
        periodEnd: input.periodEnd ?? null,
        filtersJson:
          input.filters !== undefined && input.filters !== null
            ? JSON.stringify(input.filters)
            : null,
        dataJson: JSON.stringify(data),
        generatedById: generatedById ?? null,
      },
      include: { farm: true, generatedBy: true },
    });
  }

  private async compute(
    farmId: string,
    type: string,
    period: Period,
  ) {
    switch (type) {
      case "OPERATIONS_OVERVIEW":
        return this.operationsOverview(farmId, period);
      case "CROP_CYCLE_SUMMARY":
        return this.cropCycleSummary(farmId, period);
      case "TASK_SUMMARY":
        return this.taskSummary(farmId, period);
      case "IRRIGATION_SUMMARY":
        return this.irrigationSummary(farmId, period);
      case "INVENTORY_SUMMARY":
        return this.inventorySummary(farmId);
      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }

  private async operationsOverview(farmId: string, period: Period) {
    const [locations, cycles, tasks, irrigation, inventory] =
      await Promise.all([
        this.prisma.farmLocation.count({
          where: { farmId, active: true },
        }),
        this.prisma.cropCycle.findMany({ where: { farmId } }),
        this.prisma.task.findMany({ where: { farmId } }),
        this.prisma.irrigationLog.findMany({
          where: {
            farmId,
            ...periodWhere("irrigatedAt", period),
          },
        }),
        this.prisma.inventoryItem.count({
          where: { farmId, active: true },
        }),
      ]);

    return {
      locations,
      inventoryItems: inventory,
      cycles: {
        total: cycles.length,
        byStatus: countBy(cycles, (cycle) => cycle.status),
      },
      tasks: {
        total: tasks.length,
        byStatus: countBy(tasks, (task) => task.status),
        byPriority: countBy(tasks, (task) => task.priority),
        overdue: tasks.filter(
          (task) =>
            task.dueDate !== null &&
            task.dueDate < new Date() &&
            task.status !== "DONE" &&
            task.status !== "SKIPPED",
        ).length,
      },
      irrigation: {
        events: irrigation.length,
        totalLiters: irrigation.reduce(
          (sum, log) => sum + (log.volumeLiters ?? 0),
          0,
        ),
        totalMinutes: irrigation.reduce(
          (sum, log) => sum + (log.durationMinutes ?? 0),
          0,
        ),
      },
    };
  }

  private async cropCycleSummary(farmId: string, period: Period) {
    const cycles = await this.prisma.cropCycle.findMany({
      where: {
        farmId,
        ...periodWhere("startDate", period),
      },
      include: {
        location: true,
        stages: { orderBy: { sequence: "asc" } },
      },
      orderBy: { startDate: "desc" },
    });
    return {
      cycles: cycles.map((cycle) => {
        const total = cycle.stages.length;
        const completed = cycle.stages.filter(
          (stage) => stage.status === "COMPLETED",
        ).length;
        return {
          id: cycle.id,
          name: cycle.name,
          crop: cycle.crop,
          variety: cycle.variety,
          status: cycle.status,
          location: cycle.location.name,
          startDate: cycle.startDate,
          expectedEndDate: cycle.expectedEndDate,
          stageProgress:
            total === 0 ? 0 : Math.round((completed / total) * 100),
          stagesCompleted: completed,
          stagesTotal: total,
        };
      }),
    };
  }

  private async taskSummary(farmId: string, period: Period) {
    const tasks = await this.prisma.task.findMany({
      where: {
        farmId,
        ...periodWhere("dueDate", period),
      },
      include: { assignee: true, cycle: true },
    });
    const now = new Date();
    const overdue = tasks.filter(
      (task) =>
        task.dueDate !== null &&
        task.dueDate < now &&
        task.status !== "DONE" &&
        task.status !== "SKIPPED",
    );
    return {
      total: tasks.length,
      byStatus: countBy(tasks, (task) => task.status),
      byPriority: countBy(tasks, (task) => task.priority),
      overdue: overdue.map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        assignee: task.assignee?.name ?? null,
      })),
      overdueCount: overdue.length,
    };
  }

  private async irrigationSummary(farmId: string, period: Period) {
    const logs = await this.prisma.irrigationLog.findMany({
      where: {
        farmId,
        ...periodWhere("irrigatedAt", period),
      },
      orderBy: { irrigatedAt: "asc" },
    });
    const byMethod = new Map<
      string,
      { events: number; minutes: number; liters: number }
    >();
    const byDay = new Map<string, { events: number; liters: number }>();
    for (const log of logs) {
      const method = byMethod.get(log.method) ?? {
        events: 0,
        minutes: 0,
        liters: 0,
      };
      method.events += 1;
      method.minutes += log.durationMinutes ?? 0;
      method.liters += log.volumeLiters ?? 0;
      byMethod.set(log.method, method);

      const day = log.irrigatedAt.toISOString().slice(0, 10);
      const dayEntry = byDay.get(day) ?? { events: 0, liters: 0 };
      dayEntry.events += 1;
      dayEntry.liters += log.volumeLiters ?? 0;
      byDay.set(day, dayEntry);
    }
    return {
      events: logs.length,
      totalMinutes: logs.reduce(
        (sum, log) => sum + (log.durationMinutes ?? 0),
        0,
      ),
      totalLiters: logs.reduce(
        (sum, log) => sum + (log.volumeLiters ?? 0),
        0,
      ),
      byMethod: Object.fromEntries(byMethod),
      byDay: Object.fromEntries(byDay),
    };
  }

  private async inventorySummary(farmId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { farmId },
      include: { transactions: true },
    });
    const active = items.filter((item) => item.active);
    const lowStock = active.filter(
      (item) =>
        item.minQuantity !== null && item.quantity < item.minQuantity,
    );
    const stockValue = active.reduce(
      (sum, item) => sum + (item.unitCost ?? 0) * item.quantity,
      0,
    );
    return {
      totalItems: items.length,
      activeItems: active.length,
      lowStockCount: lowStock.length,
      lowStock: lowStock.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        minQuantity: item.minQuantity,
      })),
      byCategory: countBy(active, (item) => item.category),
      totalStockValue: Math.round(stockValue * 100) / 100,
      totalTransactions: items.reduce(
        (sum, item) => sum + item.transactions.length,
        0,
      ),
    };
  }
}
