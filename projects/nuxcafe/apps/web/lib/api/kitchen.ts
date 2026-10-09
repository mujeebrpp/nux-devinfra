import { z } from "zod";
import {
  MenuItemCategorySchema,
  OrderStatusSchema,
  PageMetaSchema,
  ProductionStatusSchema,
  apiFetch,
  toQueryString,
} from "./client";
import { MenuItemSchema } from "./menu";

export const ProductionSchema = z.object({
  id: z.string(),
  menuItemId: z.string(),
  orderId: z.string().nullable(),
  quantity: z.number(),
  status: ProductionStatusSchema,
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  menuItem: MenuItemSchema,
});

export type Production = z.infer<typeof ProductionSchema>;

export const ProductionListResponseSchema = z.object({
  data: z.array(ProductionSchema),
  meta: PageMetaSchema,
});

export type ProductionListResponse = z.infer<
  typeof ProductionListResponseSchema
>;

export interface ListProductionsQuery {
  page?: number;
  limit?: number;
  status?: string;
  menuItemSlug?: string;
}

export async function listProductions(
  query: ListProductionsQuery = {},
): Promise<ProductionListResponse> {
  return apiFetch(
    `/api/production${toQueryString(query)}`,
    ProductionListResponseSchema,
  );
}

export async function getProduction(
  id: string,
): Promise<Production> {
  return apiFetch(
    `/api/production/${encodeURIComponent(id)}`,
    ProductionSchema,
  );
}

export interface CreateProductionInput {
  menuItemSlug: string;
  quantity?: number;
  orderId?: string;
}

export async function createProduction(
  input: CreateProductionInput,
): Promise<Production> {
  return apiFetch("/api/production", ProductionSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function startProduction(
  id: string,
): Promise<Production> {
  return apiFetch(
    `/api/production/${encodeURIComponent(id)}/start`,
    ProductionSchema,
    { method: "POST" },
  );
}

export async function completeProduction(
  id: string,
): Promise<Production> {
  return apiFetch(
    `/api/production/${encodeURIComponent(id)}/complete`,
    ProductionSchema,
    { method: "POST" },
  );
}

export async function cancelProduction(
  id: string,
): Promise<Production> {
  return apiFetch(
    `/api/production/${encodeURIComponent(id)}/cancel`,
    ProductionSchema,
    { method: "POST" },
  );
}

export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  menuItemId: z.string(),
  quantity: z.number(),
  priceCents: z.number(),
  menuItem: MenuItemSchema,
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: OrderStatusSchema,
  totalCents: z.number(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(OrderItemSchema),
  productions: z.array(ProductionSchema),
  sale: z
    .object({
      id: z.string(),
      orderId: z.string(),
      amountCents: z.number(),
      itemsCount: z.number(),
      soldAt: z.string(),
    })
    .nullable(),
});

export type Order = z.infer<typeof OrderSchema>;

/** Order as returned by the list endpoint (no productions). */
export const OrderListItemSchema = OrderSchema.omit({
  productions: true,
});

export type OrderListItem = z.infer<typeof OrderListItemSchema>;

export const OrderListResponseSchema = z.object({
  data: z.array(OrderListItemSchema),
  meta: PageMetaSchema,
});

export type OrderListResponse = z.infer<
  typeof OrderListResponseSchema
>;

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export async function listOrders(
  query: ListOrdersQuery = {},
): Promise<OrderListResponse> {
  return apiFetch(
    `/api/orders${toQueryString(query)}`,
    OrderListResponseSchema,
  );
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch(
    `/api/orders/${encodeURIComponent(id)}`,
    OrderSchema,
  );
}

export interface CreateOrderInput {
  items: { menuItemSlug: string; quantity: number }[];
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<Order> {
  return apiFetch("/api/orders", OrderSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function completeOrder(id: string): Promise<Order> {
  return apiFetch(
    `/api/orders/${encodeURIComponent(id)}/complete`,
    OrderSchema,
    { method: "POST" },
  );
}

export async function cancelOrder(id: string): Promise<Order> {
  return apiFetch(
    `/api/orders/${encodeURIComponent(id)}/cancel`,
    OrderSchema,
    { method: "POST" },
  );
}

export const MenuItemOptionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: MenuItemCategorySchema,
  priceCents: z.number(),
});

export type MenuItemOption = z.infer<typeof MenuItemOptionSchema>;

/** Compact menu item list for order/production forms. */
export const MenuItemOptionListResponseSchema = z.object({
  data: z.array(MenuItemOptionSchema),
  meta: PageMetaSchema,
});

export async function listMenuItemOptions(): Promise<MenuItemOption[]> {
  const response = await apiFetch(
    "/api/menu-items?limit=100",
    MenuItemOptionListResponseSchema,
  );
  return response.data;
}
