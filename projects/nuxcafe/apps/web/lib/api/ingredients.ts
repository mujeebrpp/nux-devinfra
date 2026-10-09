import { z } from "zod";
import {
  IngredientUnitSchema,
  PageMetaSchema,
  apiFetch,
  toQueryString,
} from "./client";

export const IngredientSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  unit: IngredientUnitSchema,
  costCents: z.number(),
  quantity: z.number(),
  minQuantity: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

export const IngredientListItemSchema = IngredientSchema.extend({
  isLowStock: z.boolean(),
});

export type IngredientListItem = z.infer<typeof IngredientListItemSchema>;

export const IngredientListResponseSchema = z.object({
  data: z.array(IngredientListItemSchema),
  meta: PageMetaSchema,
});

export type IngredientListResponse = z.infer<
  typeof IngredientListResponseSchema
>;

export interface ListIngredientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  unit?: string;
  includeInactive?: boolean;
}

export async function listIngredients(
  query: ListIngredientsQuery = {},
): Promise<IngredientListResponse> {
  return apiFetch(
    `/api/ingredients${toQueryString(query)}`,
    IngredientListResponseSchema,
  );
}

export async function getIngredient(
  slug: string,
): Promise<IngredientListItem> {
  return apiFetch(
    `/api/ingredients/${encodeURIComponent(slug)}`,
    IngredientListItemSchema,
  );
}

export interface CreateIngredientInput {
  name: string;
  slug?: string;
  unit: string;
  costCents: number;
  quantity?: number;
  minQuantity?: number;
  isActive?: boolean;
}

export async function createIngredient(
  input: CreateIngredientInput,
): Promise<IngredientListItem> {
  return apiFetch("/api/ingredients", IngredientListItemSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type UpdateIngredientInput = Partial<CreateIngredientInput>;

export async function updateIngredient(
  slug: string,
  input: UpdateIngredientInput,
): Promise<IngredientListItem> {
  return apiFetch(
    `/api/ingredients/${encodeURIComponent(slug)}`,
    IngredientListItemSchema,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export async function deleteIngredient(slug: string): Promise<Ingredient> {
  return apiFetch(
    `/api/ingredients/${encodeURIComponent(slug)}`,
    IngredientSchema,
    { method: "DELETE" },
  );
}
