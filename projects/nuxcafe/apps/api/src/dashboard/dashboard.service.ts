import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type DashboardOrder = Prisma.OrderGetPayload<{
  include: { items: { include: { menuItem: true } } };
}>;

export interface DashboardLowStockIngredient {
  slug: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
}

export interface DashboardOverview {
  today: {
    revenueCents: number;
    salesCount: number;
    ordersCount: number;
  };
  kitchen: {
    queued: number;
    inProgress: number;
  };
  lowStock: DashboardLowStockIngredient[];
  recentOrders: DashboardOrder[];
  counts: {
    menuItems: number;
    ingredients: number;
    recipes: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<DashboardOverview> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [
      todaySales,
      ordersToday,
      queuedProductions,
      inProgressProductions,
      activeIngredients,
      recentOrders,
      menuItemCount,
      ingredientCount,
      recipeCount,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { soldAt: { gte: startOfToday } },
        _sum: { amountCents: true },
        _count: true,
      }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.production.count({ where: { status: "QUEUED" } }),
      this.prisma.production.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.ingredient.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: { include: { menuItem: true } } },
      }),
      this.prisma.menuItem.count({ where: { isActive: true } }),
      this.prisma.ingredient.count({ where: { isActive: true } }),
      this.prisma.recipe.count(),
    ]);

    const lowStock = activeIngredients
      .filter((ingredient) => ingredient.quantity <= ingredient.minQuantity)
      .map((ingredient) => ({
        slug: ingredient.slug,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: ingredient.quantity,
        minQuantity: ingredient.minQuantity,
      }));

    return {
      today: {
        revenueCents: todaySales._sum.amountCents ?? 0,
        salesCount: todaySales._count,
        ordersCount: ordersToday,
      },
      kitchen: {
        queued: queuedProductions,
        inProgress: inProgressProductions,
      },
      lowStock,
      recentOrders,
      counts: {
        menuItems: menuItemCount,
        ingredients: ingredientCount,
        recipes: recipeCount,
      },
    };
  }
}
