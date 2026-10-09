import { z } from "zod";
import {
  IngredientUnitSchema,
  PageMetaSchema,
  apiFetch,
  toQueryString,
} from "./client";

export const StockLevelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  unit: IngredientUnitSchema,
  costCents: z.number(),
  quantity: z.number(),
  minQuantity: z.number(),
  isActive: z.boolean(),
  isLowStock: z.boolean(),
});

export type StockLevel = z.infer<typeof StockLevelSchema>;

export const StockLevelsResponseSchema = z.object({
  ingredients: z.array(StockLevelSchema),
  lowStockCount: z.number(),
  totalValueCents: z.number(),
});

export type StockLevelsResponse = z.infer<
  typeof StockLevelsResponseSchema
>;

export const StockMovementSchema = z.object({
  id: z.string(),
  ingredientId: z.string(),
  type: z.enum(["PURCHASE", "USAGE", "ADJUSTMENT", "WASTE"]),
  quantity: z.number(),
  note: z.string().nullable(),
  reference: z.string().nullable(),
  createdAt: z.string(),
  ingredient: StockLevelSchema,
});

export type StockMovement = z.infer<typeof StockMovementSchema>;

export const StockMovementListResponseSchema = z.object({
  data: z.array(StockMovementSchema),
  meta: PageMetaSchema,
});

export type StockMovementListResponse = z.infer<
  typeof StockMovementListResponseSchema
>;

export interface ListStockMovementsQuery {
  page?: number;
  limit?: number;
  ingredientSlug?: string;
  type?: string;
}

export async function getStockLevels(): Promise<StockLevelsResponse> {
  return apiFetch("/api/stock/levels", StockLevelsResponseSchema);
}

export async function listStockMovements(
  query: ListStockMovementsQuery = {},
): Promise<StockMovementListResponse> {
  return apiFetch(
    `/api/stock/movements${toQueryString(query)}`,
    StockMovementListResponseSchema,
  );
}

export interface CreateStockMovementInput {
  ingredientSlug: string;
  type: string;
  quantity: number;
  note?: string;
  reference?: string;
}

export const StockMovementResultSchema = z.object({
  movement: StockMovementSchema,
  ingredient: StockLevelSchema,
});

export type StockMovementResult = z.infer<
  typeof StockMovementResultSchema
>;

export async function createStockMovement(
  input: CreateStockMovementInput,
): Promise<StockMovementResult> {
  return apiFetch("/api/stock/movements", StockMovementResultSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
