import { z } from "zod";

/**
 * A Zod schema whose parse() output is T, with a deliberately loose
 * input type: request bodies arrive as JSON and date/number fields are
 * coerced at the schema boundary, so the static input type cannot
 * mirror the Prisma input type.
 */
export type PrismaSchema<T> = z.ZodType<T, z.ZodTypeDef, any>;

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
