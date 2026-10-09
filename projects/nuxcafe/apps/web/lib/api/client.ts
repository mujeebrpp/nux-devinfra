import { z } from "zod";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3095";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetch a JSON endpoint from the NuxCafe API and validate the
 * payload against a zod schema. On non-2xx responses the API's
 * `{ message }` body is surfaced as the error message.
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(
      "Unable to reach the API. Is the API server running on port 3095?",
      0,
    );
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(message, response.status);
  }

  const payload = await response.json();
  return schema.parse(payload);
}

export const PageMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PageMeta = z.infer<typeof PageMetaSchema>;

export const IngredientUnitSchema = z.enum(["G", "KG", "ML", "L", "PCS"]);
export type IngredientUnit = z.infer<typeof IngredientUnitSchema>;

export const MenuItemCategorySchema = z.enum([
  "COFFEE",
  "TEA",
  "PASTRY",
  "FOOD",
  "OTHER",
]);
export type MenuItemCategory = z.infer<typeof MenuItemCategorySchema>;

export const StockMovementTypeSchema = z.enum([
  "PURCHASE",
  "USAGE",
  "ADJUSTMENT",
  "WASTE",
]);
export type StockMovementType = z.infer<typeof StockMovementTypeSchema>;

export const ProductionStatusSchema = z.enum([
  "QUEUED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export type ProductionStatus = z.infer<typeof ProductionStatusSchema>;

export const OrderStatusSchema = z.enum([
  "PENDING",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/** Build a query string from defined, non-empty values. */
export function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
