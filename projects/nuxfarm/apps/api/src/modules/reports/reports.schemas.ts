import { z } from "zod";
import { Prisma } from "@prisma/client";

export const reportTypeSchema = z.enum([
  "OPERATIONS_OVERVIEW",
  "CROP_CYCLE_SUMMARY",
  "TASK_SUMMARY",
  "IRRIGATION_SUMMARY",
  "INVENTORY_SUMMARY",
]);

export const generateReportSchema = z.object({
  type: reportTypeSchema,
  title: z.string().min(1).max(300),
  periodStart: z.coerce.date().optional().nullable(),
  periodEnd: z.coerce.date().optional().nullable(),
  filters: z.record(z.unknown()).optional().nullable(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;

export const reportListQuerySchema = z.object({
  type: reportTypeSchema.optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
});

export type ReportRecord = Prisma.ReportGetPayload<{
  include: { farm: true; generatedBy: true };
}>;
