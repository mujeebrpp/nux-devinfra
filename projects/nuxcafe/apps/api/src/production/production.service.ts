import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ProductionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductionDto } from "./dto/create-production.dto";
import { ProductionQueryDto } from "./dto/production-query.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type ProductionListItem = Prisma.ProductionGetPayload<{
  include: { menuItem: true };
}>;

export interface ProductionListResult {
  data: ProductionListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ACTIVE_STATUSES: ProductionStatus[] = ["QUEUED", "IN_PROGRESS"];

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductionQueryDto): Promise<ProductionListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: Prisma.ProductionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.menuItemSlug
        ? { menuItem: { slug: query.menuItemSlug } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.production.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: { menuItem: true },
      }),
      this.prisma.production.count({ where }),
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

  async findById(id: string): Promise<ProductionListItem> {
    const production = await this.prisma.production.findUnique({
      where: { id },
      include: { menuItem: true },
    });
    if (!production) {
      throw new NotFoundException(`Production run "${id}" not found`);
    }
    return production;
  }

  /** Manually queue a production run (e.g. batch prep). */
  async create(dto: CreateProductionDto): Promise<ProductionListItem> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { slug: dto.menuItemSlug },
    });
    if (!menuItem) {
      throw new NotFoundException(
        `Menu item "${dto.menuItemSlug}" not found`,
      );
    }

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });
      if (!order) {
        throw new NotFoundException(`Order "${dto.orderId}" not found`);
      }
    }

    return this.prisma.production.create({
      data: {
        menuItemId: menuItem.id,
        quantity: dto.quantity ?? 1,
        ...(dto.orderId ? { orderId: dto.orderId } : {}),
      },
      include: { menuItem: true },
    });
  }

  /** Mark a queued run as in progress. */
  async start(id: string): Promise<ProductionListItem> {
    const production = await this.findById(id);
    if (production.status !== ProductionStatus.QUEUED) {
      throw new BadRequestException(
        `Only queued runs can be started (current status: ${production.status})`,
      );
    }

    return this.prisma.production.update({
      where: { id },
      data: {
        status: ProductionStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: { menuItem: true },
    });
  }

  /** Mark a run as completed. */
  async complete(id: string): Promise<ProductionListItem> {
    const production = await this.findById(id);
    if (!ACTIVE_STATUSES.includes(production.status)) {
      throw new BadRequestException(
        `Only queued or in-progress runs can be completed (current status: ${production.status})`,
      );
    }

    return this.prisma.production.update({
      where: { id },
      data: {
        status: ProductionStatus.COMPLETED,
        startedAt: production.startedAt ?? new Date(),
        completedAt: new Date(),
      },
      include: { menuItem: true },
    });
  }

  /** Cancel a queued or in-progress run. */
  async cancel(id: string): Promise<ProductionListItem> {
    const production = await this.findById(id);
    if (!ACTIVE_STATUSES.includes(production.status)) {
      throw new BadRequestException(
        `Only queued or in-progress runs can be cancelled (current status: ${production.status})`,
      );
    }

    return this.prisma.production.update({
      where: { id },
      data: { status: ProductionStatus.CANCELLED },
      include: { menuItem: true },
    });
  }
}
