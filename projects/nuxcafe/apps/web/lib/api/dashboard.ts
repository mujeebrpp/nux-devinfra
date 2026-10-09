import { z } from "zod";
import { apiFetch } from "./client";
import { OrderItemSchema } from "./kitchen";

export const DashboardLowStockIngredientSchema = z.object({
  slug: z.string(),
  name: z.string(),
  unit: z.enum(["G", "KG", "ML", "L", "PCS"]),
  quantity: z.number(),
  minQuantity: z.number(),
});

export type DashboardLowStockIngredient = z.infer<
  typeof DashboardLowStockIngredientSchema
>;

export const DashboardOverviewSchema = z.object({
  today: z.object({
    revenueCents: z.number(),
    salesCount: z.number(),
    ordersCount: z.number(),
  }),
  kitchen: z.object({
    queued: z.number(),
    inProgress: z.number(),
  }),
  lowStock: z.array(DashboardLowStockIngredientSchema),
  recentOrders: z.array(
    z.object({
      id: z.string(),
      number: z.string(),
      status: z.enum([
        "PENDING",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ]),
      totalCents: z.number(),
      completedAt: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      items: z.array(OrderItemSchema),
    }),
  ),
  counts: z.object({
    menuItems: z.number(),
    ingredients: z.number(),
    recipes: z.number(),
  }),
});

export type DashboardOverview = z.infer<
  typeof DashboardOverviewSchema
>;

export async function getDashboard(): Promise<DashboardOverview> {
  return apiFetch("/api/dashboard", DashboardOverviewSchema);
}
