import { z } from "zod";
import { apiFetch } from "./client";
import { MenuItemSchema } from "./menu";
import { StockLevelSchema } from "./stock";

export const RecipeIngredientSchema = StockLevelSchema.omit({
  isLowStock: true,
});

export type RecipeIngredient = z.infer<
  typeof RecipeIngredientSchema
>;

export const RecipeItemSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  ingredientId: z.string(),
  quantity: z.number(),
  ingredient: RecipeIngredientSchema,
});

export type RecipeItem = z.infer<typeof RecipeItemSchema>;

export const RecipeSchema = z.object({
  id: z.string(),
  menuItemId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(RecipeItemSchema),
});

export type Recipe = z.infer<typeof RecipeSchema>;

/** Recipe summary returned by the recipes endpoints. */
export const RecipeDetailSchema = z.object({
  id: z.string(),
  items: z.array(RecipeItemSchema),
  totalCostCents: z.number(),
});

export type RecipeDetail = z.infer<typeof RecipeDetailSchema>;

export const RecipeByMenuItemSchema = z.object({
  menuItem: MenuItemSchema,
  recipe: RecipeDetailSchema.nullable(),
});

export type RecipeByMenuItem = z.infer<
  typeof RecipeByMenuItemSchema
>;

export interface UpsertRecipeInput {
  items: { ingredientSlug: string; quantity: number }[];
}

export async function getRecipe(
  menuItemSlug: string,
): Promise<RecipeByMenuItem> {
  return apiFetch(
    `/api/recipes/${encodeURIComponent(menuItemSlug)}`,
    RecipeByMenuItemSchema,
  );
}

export async function upsertRecipe(
  menuItemSlug: string,
  input: UpsertRecipeInput,
): Promise<RecipeByMenuItem> {
  return apiFetch(
    `/api/recipes/${encodeURIComponent(menuItemSlug)}`,
    RecipeByMenuItemSchema,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export async function deleteRecipe(
  menuItemSlug: string,
): Promise<RecipeByMenuItem> {
  return apiFetch(
    `/api/recipes/${encodeURIComponent(menuItemSlug)}`,
    RecipeByMenuItemSchema,
    { method: "DELETE" },
  );
}
