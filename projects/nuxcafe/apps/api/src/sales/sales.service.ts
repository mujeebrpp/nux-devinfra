import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SaleQueryDto } from "./dto/sale-query.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type SaleWithOrder = Prisma.SaleGetPayload<{
  include: { order: { select: { number: true; status: true } } };
}>;

export interface SaleDaySummary {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  amountCents: number;
  orders: number;
}

export interface SalesSummary {
  today: SaleDaySummary;
  last7Days: SaleDaySummary[];
  total7Days: { amountCents: number; orders: number };
}

export interface SaleListResult {
  data: SaleWithOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Local YYYY-MM-DD for a date. The 7-day buckets are built
 * from local midnights, so the sale dates must be formatted
 * in local time too - otherwise sales on the current local
 * day never land in a bucket on timezones ahead of UTC.
 */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Revenue summary: today plus a rolling 7-day breakdown.
   * Sales are aggregated in code so the breakdown keeps a
   * stable 7-entry shape even on quiet days.
   */
  async getSummary(): Promise<SalesSummary> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const since = new Date(startOfToday.getTime() - 6 * 86_400_000);

    const sales = await this.prisma.sale.findMany({
      where: { soldAt: { gte: since } },
      orderBy: { soldAt: "asc" },
    });

    const days: SaleDaySummary[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(startOfToday.getTime() - offset * 86_400_000);
      days.push({ date: toIsoDate(day), amountCents: 0, orders: 0 });
    }
    const indexByDate = new Map(days.map((day, index) => [day.date, index]));

    for (const sale of sales) {
      const index = indexByDate.get(toIsoDate(sale.soldAt));
      if (index === undefined) {
        continue;
      }
      days[index].amountCents += sale.amountCents;
      days[index].orders += 1;
    }

    const today = days[days.length - 1];
    const total7Days = days.reduce(
      (sum, day) => ({
        amountCents: sum.amountCents + day.amountCents,
        orders: sum.orders + day.orders,
      }),
      { amountCents: 0, orders: 0 },
    );

    return { today, last7Days: days, total7Days };
  }

  /** Recent sales, newest first, with the originating order. */
  async list(query: SaleQueryDto): Promise<SaleListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: Prisma.SaleWhereInput = {};

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ soldAt: "desc" }, { id: "desc" }],
        include: {
          order: { select: { number: true, status: true } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
