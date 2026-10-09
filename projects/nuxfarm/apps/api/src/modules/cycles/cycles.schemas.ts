import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaSchema } from "../../common/schemas/common.schemas";

export const cycleStatusSchema = z.enum([
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "ABANDONED",
]);

export const stageStatusSchema = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
]);

export const createCycleSchema: PrismaSchema<
  Omit<Prisma.CropCycleUncheckedCreateInput, "farmId">
> =
  z.object({
    locationId: z.string().uuid(),
    name: z.string().min(1).max(200),
    crop: z.string().min(1).max(200),
    variety: z.string().max(200).optional().nullable(),
    status: cycleStatusSchema.default("PLANNED"),
    startDate: z.coerce.date(),
    expectedEndDate: z.coerce.date().optional().nullable(),
    actualEndDate: z.coerce.date().optional().nullable(),
    plantingMethod: z.string().max(200).optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
    createdById: z.string().uuid().optional().nullable(),
  });

export const updateCycleSchema: PrismaSchema<Prisma.CropCycleUncheckedUpdateInput> = z
  .object({
    name: z.string().min(1).max(200).optional(),
    crop: z.string().min(1).max(200).optional(),
    variety: z.string().max(200).optional().nullable(),
    status: cycleStatusSchema.optional(),
    startDate: z.coerce.date().optional(),
    expectedEndDate: z.coerce.date().optional().nullable(),
    actualEndDate: z.coerce.date().optional().nullable(),
    plantingMethod: z.string().max(200).optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
  })
  .strict();

export const createStageSchema: PrismaSchema<
  Omit<Prisma.CycleStageUncheckedCreateInput, "cycleId">
> =
  z.object({
    name: z.string().min(1).max(200),
    sequence: z.coerce.number().int().min(0),
    status: stageStatusSchema.default("PLANNED"),
    plannedStartDate: z.coerce.date().optional().nullable(),
    plannedEndDate: z.coerce.date().optional().nullable(),
    actualStartDate: z.coerce.date().optional().nullable(),
    actualEndDate: z.coerce.date().optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
  });

export const updateStageSchema: PrismaSchema<Prisma.CycleStageUncheckedUpdateInput> = z
  .object({
    name: z.string().min(1).max(200).optional(),
    sequence: z.coerce.number().int().min(0).optional(),
    status: stageStatusSchema.optional(),
    plannedStartDate: z.coerce.date().optional().nullable(),
    plannedEndDate: z.coerce.date().optional().nullable(),
    actualStartDate: z.coerce.date().optional().nullable(),
    actualEndDate: z.coerce.date().optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
  })
  .strict();
