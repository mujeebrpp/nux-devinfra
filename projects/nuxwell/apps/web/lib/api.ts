import { z } from "zod";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3091";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the API. Is the API server running on port 3091?",
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
    );
  }

  const payload = await response.json();
  return schema.parse(payload);
}

export const FacilitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.enum(["GYM", "YOGA_STUDIO", "POOL", "SAUNA", "COURT"]),
  location: z.string(),
  capacity: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Facility = z.infer<typeof FacilitySchema>;

export const FacilityListItemSchema = FacilitySchema.extend({
  _count: z.object({ services: z.number() }),
});

export type FacilityListItem = z.infer<typeof FacilityListItemSchema>;

export const FacilityDetailSchema = FacilitySchema.extend({
  services: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      durationMinutes: z.number(),
      priceCents: z.number(),
      isActive: z.boolean(),
    }),
  ),
});

export type FacilityDetail = z.infer<typeof FacilityDetailSchema>;

export const FacilityListResponseSchema = z.object({
  data: z.array(FacilityListItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type FacilityListResponse = z.infer<typeof FacilityListResponseSchema>;

export async function listFacilities(): Promise<FacilityListResponse> {
  return apiFetch("/api/facilities", FacilityListResponseSchema);
}

export async function getFacility(slug: string): Promise<FacilityDetail> {
  return apiFetch(
    `/api/facilities/${encodeURIComponent(slug)}`,
    FacilityDetailSchema,
  );
}

export async function getApiHealth(): Promise<{
  status: "ok" | "error";
  database: "ok" | "error";
  timestamp: string;
}> {
  return apiFetch(
    "/api/health",
    z.object({
      status: z.enum(["ok", "error"]),
      database: z.enum(["ok", "error"]),
      timestamp: z.string(),
    }),
  );
}
