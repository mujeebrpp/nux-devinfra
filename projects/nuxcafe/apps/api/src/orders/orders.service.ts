import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
  constructor(private prisma: PrismaService) {}

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

  /** Place an order. Every line becomes a queued kitchen production run; the order total is computed from current menu item prices. Moves the stock check inside the transaction with FOR UPDATE locking to prevent race conditions with concurrent orders. */
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

    // Build consumption map: ingredientId -> total amount needed
    const consumption = new Map<string, number>();
    const recipesByMenuItemId = new Map<string, any[]>();
    for (const item of dto.items) {
      const menuItem = bySlug.get(item.menuItemSlug)!;
      const recipe = await this.prisma.recipe.findUniqueOrThrow({
        where: { menuItemId: menuItem.id },
        include: { items: true },
      });
      recipesByMenuItemId.set(menuItem.id, recipe.items);
      for (const recipeItem of recipe.items) {
        const ingredientId = recipeItem.ingredientId;
        const amount = recipeItem.quantity * item.quantity;
        if (consumption.has(ingredientId)) {
          consumption.set(ingredientId, consumption.get(ingredientId)! + amount);
        } else {
          consumption.set(ingredientId, amount);
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // --- Lock ingredients for update to prevent race conditions ---
      const ingredientIds = [...consumption.keys()];
      const dbIngredients = await tx.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      });
      const ingredientQuantities = new Map<string, number>();
      for (const ing of dbIngredients) {
        ingredientQuantities.set(ing.id, ing.quantity);
      }

      // Check stock inside locked transaction
      for (const [ingredientId, needed] of consumption) {
        const currentQty = ingredientQuantities.get(ingredientId) ?? 0;
        if (currentQty - needed < 0) {
          throw new BadRequestException(
            `Insufficient stock for ingredient ID ${ingredientId}`,
          );
        }
      }

      // Compute order total from current menu item prices
      let totalCents = 0;
      for (const item of dto.items) {
        const menuItem = bySlug.get(item.menuItemSlug);
        if (menuItem) {
          totalCents += menuItem.priceCents * item.quantity;
        }
      }

      const itemsCount = dto.items.reduce((sum, item) => sum + item.quantity, 0);

      // Create the order with items
      const order = await tx.order.create({
        data: {
          number,
          status: OrderStatus.PENDING,
          totalCents,
          items: {
            create: dto.items.map((item) => ({
              menuItem: {
                connect: { slug: item.menuItemSlug },
              },
              quantity: item.quantity,
              priceCents: bySlug.get(item.menuItemSlug)?.priceCents ?? 0,
            })),
          },
          productions: {
            create: dto.items.flatMap((item) => {
              const menuItem = bySlug.get(item.menuItemSlug)!;
              const recipeItems = recipesByMenuItemId.get(menuItem.id)!;
              return recipeItems.map((ri: { ingredientId: string; quantity: number }) => ({
                menuItem: {
                  connect: { id: menuItem.id },
                },
                quantity: 1,
                status: "QUEUED" as const,
              }));
            }),
          },
        },
        include: {
          items: { include: { menuItem: true } },
          productions: { include: { menuItem: true } },
        },
      });

      // Deduct stock and create usage movements
      for (const [ingredientId, amount] of consumption) {
        const currentQty = ingredientQuantities.get(ingredientId) ?? 0;
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: { quantity: currentQty - amount },
        });

        await tx.stockMovement.create({
          data: {
            ingredientId,
            type: StockMovementType.USAGE,
            quantity: amount,
            note: `Order ${number}`,
            reference: number,
          },
        });
      }

      // Return the created order
      return this.findById(order.id);
    });
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

  /** Complete an order: consumes stock and records the sale. */
  async complete(id: string): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Only pending orders can be completed (current status: ${order.status})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const completedOrder = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.COMPLETED },
        include: {
          items: { include: { menuItem: true } },
          productions: { include: { menuItem: true } },
          sale: true,
        },
      });

      // Create sale record from order items
      let amountCents = 0;
      let itemsCount = 0;
      for (const item of order.items) {
        amountCents += item.priceCents * item.quantity;
        itemsCount += item.quantity;
      }

      await tx.sale.create({
        data: {
          orderId: id,
          amountCents,
          itemsCount,
        },
      });

      return completedOrder;
    });
  }
}