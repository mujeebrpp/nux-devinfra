import { z } from "zod";
import {
  MenuItemCategorySchema,
  PageMetaSchema,
  apiFetch,
  toQueryString,
} from "./client";

export const MenuItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: MenuItemCategorySchema,
  priceCents: z.number(),
  prepMinutes: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuItemListItemSchema = MenuItemSchema.extend({
  recipe: z
    .object({ _count: z.object({ items: z.number() }) })
    .nullable(),
});

export type MenuItemListItem = z.infer<
  typeof MenuItemListItemSchema
>;

export const MenuItemListResponseSchema = z.object({
  data: z.array(MenuItemListItemSchema),
  meta: PageMetaSchema,
});

export type MenuItemListResponse = z.infer<
  typeof MenuItemListResponseSchema
>;

export interface ListMenuItemsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  includeInactive?: boolean;
}

export async function listMenuItems(
  query: ListMenuItemsQuery = {},
): Promise<MenuItemListResponse> {
  return apiFetch(
    `/api/menu-items${toQueryString(query)}`,
    MenuItemListResponseSchema,
  );
}

export interface CreateMenuItemInput {
  name: string;
  slug?: string;
  description?: string;
  category: string;
  priceCents: number;
  prepMinutes?: number;
  isActive?: boolean;
}

export async function createMenuItem(
  input: CreateMenuItemInput,
): Promise<MenuItem> {
  return apiFetch("/api/menu-items", MenuItemSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export async function updateMenuItem(
  slug: string,
  input: UpdateMenuItemInput,
): Promise<MenuItem> {
  return apiFetch(
    `/api/menu-items/${encodeURIComponent(slug)}`,
    MenuItemSchema,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export async function deleteMenuItem(slug: string): Promise<MenuItem> {
  return apiFetch(
    `/api/menu-items/${encodeURIComponent(slug)}`,
    MenuItemSchema,
    { method: "DELETE" },
  );
}
