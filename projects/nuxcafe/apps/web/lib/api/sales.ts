import { z } from "zod";
import {
  OrderStatusSchema,
  PageMetaSchema,
  apiFetch,
  toQueryString,
} from "./client";

export const SaleOrderSchema = z.object({
  number: z.string(),
  status: OrderStatusSchema,
});

export type SaleOrder = z.infer<typeof SaleOrderSchema>;

export const SaleSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amountCents: z.number(),
  itemsCount: z.number(),
  soldAt: z.string(),
  order: SaleOrderSchema,
});

export type Sale = z.infer<typeof SaleSchema>;

export const SaleListResponseSchema = z.object({
  data: z.array(SaleSchema),
  meta: PageMetaSchema,
});

export type SaleListResponse = z.infer<typeof SaleListResponseSchema>;

export interface ListSalesQuery {
  page?: number;
  limit?: number;
}

export async function listSales(
  query: ListSalesQuery = {},
): Promise<SaleListResponse> {
  return apiFetch(
    `/api/sales${toQueryString(query)}`,
    SaleListResponseSchema,
  );
}

export const SaleDaySummarySchema = z.object({
  date: z.string(),
  amountCents: z.number(),
  orders: z.number(),
});

export type SaleDaySummary = z.infer<typeof SaleDaySummarySchema>;

export const SalesSummarySchema = z.object({
  today: SaleDaySummarySchema,
  last7Days: z.array(SaleDaySummarySchema),
  total7Days: z.object({
    amountCents: z.number(),
    orders: z.number(),
  }),
});

export type SalesSummary = z.infer<typeof SalesSummarySchema>;

export async function getSalesSummary(): Promise<SalesSummary> {
  return apiFetch("/api/sales/summary", SalesSummarySchema);
}
