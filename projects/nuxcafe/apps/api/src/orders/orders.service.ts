import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, OrderStatus, StockMovementType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { generateOrderNumber } from "../common/util";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderQueryDto } from "./dto/order-query.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "READY",
];

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: { include: { menuItem: true } };
    productions: { include: { menuItem: true } };
    sale: true;
  };
}>;

export type OrderListItem = Prisma.OrderGetPayload<{
  include: {
    items: { include: { menuItem: true } };
    sale: true;
  };
}>;

export interface OrderListResult {
  data: OrderListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: OrderQueryDto): Promise<OrderListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          items: { include: { menuItem: true } },
          sale: true,
        },
      }),
      this.prisma.order.count({ where }),
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

  async findById(id: string): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
        productions: { include: { menuItem: true } },
        sale: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }
    return order;
  }

  /**
   * Place an order. Every line becomes a queued kitchen
   * production run; the order total is computed from the
   * current menu item prices.
   */
  async create(dto: CreateOrderDto): Promise<OrderWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("An order needs at least one item");
    }

    const slugs = [...new Set(dto.items.map((item) => item.menuItemSlug))];
    const menuItems = await this.prisma.menuItem.findMany({
      where: { slug: { in: slugs }, isActive: true },
    });
    const bySlug = new Map(menuItems.map((item) => [item.slug, item]));

    for (const item of dto.items) {
      const menuItem = bySlug.get(item.menuItemSlug);
      if (!menuItem) {
        throw new BadRequestException(
          `Menu item "${item.menuItemSlug}" not found or inactive`,
        );
      }
    }

    const number = generateOrderNumber();

    const orderId = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: { number, totalCents: 0 },
      });

      let totalCents = 0;
      for (const item of dto.items) {
        const menuItem = bySlug.get(item.menuItemSlug)!;
        const lineTotal = menuItem.priceCents * item.quantity;
        totalCents += lineTotal;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: menuItem.id,
            quantity: item.quantity,
            priceCents: menuItem.priceCents,
          },
        });

        await tx.production.create({
          data: {
            menuItemId: menuItem.id,
            orderId: order.id,
            quantity: item.quantity,
            status: "QUEUED",
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { totalCents },
      });

      return order.id;
    });

    return this.findById(orderId);
  }

  /**
   * Complete an order: decrements ingredient stock per the
   * recipes, records USAGE movements, completes any active
   * production runs and creates a sale.
   */
  async complete(id: string): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException("Order is already completed");
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("Cannot complete a cancelled order");
    }

    // Aggregate ingredient consumption across all order lines.
    const consumption = new Map<string, { amount: number }>();
    for (const item of order.items) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { menuItemId: item.menuItemId },
        include: { items: true },
      });
      if (!recipe) {
        // Menu items without a recipe consume no stock.
        continue;
      }
      for (const recipeItem of recipe.items) {
        const amount = recipeItem.quantity * item.quantity;
        const existing = consumption.get(recipeItem.ingredientId);
        if (existing) {
          existing.amount += amount;
        } else {
          consumption.set(recipeItem.ingredientId, { amount });
        }
      }
    }

    // Pre-flight stock check before touching anything.
    if (consumption.size > 0) {
      const ingredients = await this.prisma.ingredient.findMany({
        where: { id: { in: [...consumption.keys()] } },
      });
      for (const ingredient of ingredients) {
        const needed = consumption.get(ingredient.id)!.amount;
        if (ingredient.quantity - needed < 0) {
          throw new BadRequestException(
            `Insufficient stock for "${ingredient.name}": need ${needed} ${ingredient.unit}, have ${ingredient.quantity} ${ingredient.unit}`,
          );
        }
      }
    }

    const itemsCount = order.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const [ingredientId, { amount }] of consumption) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: ingredientId },
        });
        if (!ingredient) {
          continue;
        }
        if (ingredient.quantity - amount < 0) {
          throw new BadRequestException(
            `Insufficient stock for "${ingredient.name}"`,
          );
        }

        await tx.ingredient.update({
          where: { id: ingredientId },
          data: { quantity: ingredient.quantity - amount },
        });

        await tx.stockMovement.create({
          data: {
            ingredientId,
            type: StockMovementType.USAGE,
            quantity: amount,
            note: `Order ${order.number}`,
            reference: order.number,
          },
        });
      }

      await tx.production.updateMany({
        where: {
          orderId: id,
          status: { in: ["QUEUED", "IN_PROGRESS"] },
        },
        data: {
          status: "COMPLETED",
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
      });

      await tx.sale.create({
        data: {
          orderId: id,
          amountCents: order.totalCents,
          itemsCount,
        },
      });
    });

    return this.findById(id);
  }

  /** Cancel an order and any active production runs for it. */
  async cancel(id: string): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }
    if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Only pending, preparing or ready orders can be cancelled (current status: ${order.status})`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      }),
      this.prisma.production.updateMany({
        where: {
          orderId: id,
          status: { in: ["QUEUED", "IN_PROGRESS"] },
        },
        data: { status: "CANCELLED" },
      }),
    ]);

    return this.findById(id);
  }
}
