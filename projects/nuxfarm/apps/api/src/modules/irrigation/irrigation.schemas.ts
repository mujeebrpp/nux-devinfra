import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaSchema } from "../../common/schemas/common.schemas";

export const irrigationMethodSchema = z.enum([
  "DRIP",
  "SPRINKLER",
  "FLOOD",
  "MANUAL",
  "OTHER",
]);

export const createIrrigationLogSchema: PrismaSchema<
  Omit<Prisma.IrrigationLogUncheckedCreateInput, "farmId">
> =
  z.object({
    locationId: z.string().uuid().optional().nullable(),
    cycleId: z.string().uuid().optional().nullable(),
    irrigatedAt: z.coerce.date(),
    method: irrigationMethodSchema.default("MANUAL"),
    durationMinutes: z.coerce.number().nonnegative().optional().nullable(),
    volumeLiters: z.coerce.number().nonnegative().optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
  });

export const updateIrrigationLogSchema: PrismaSchema<Prisma.IrrigationLogUncheckedUpdateInput> =
  z
    .object({
      locationId: z.string().uuid().optional().nullable(),
      cycleId: z.string().uuid().optional().nullable(),
      irrigatedAt: z.coerce.date().optional(),
      method: irrigationMethodSchema.optional(),
      durationMinutes: z.coerce.number().nonnegative().optional().nullable(),
      volumeLiters: z.coerce.number().nonnegative().optional().nullable(),
      notes: z.string().max(4000).optional().nullable(),
    })
    .strict();

export const irrigationQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  method: irrigationMethodSchema.optional(),
  cycleId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(500).default(200),
});
