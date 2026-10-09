import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaSchema } from "../../common/schemas/common.schemas";

export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
  "SKIPPED",
]);

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createTaskSchema: PrismaSchema<
  Omit<Prisma.TaskUncheckedCreateInput, "farmId">
> = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(4000).optional().nullable(),
  category: z.string().max(200).optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  cycleId: z.string().uuid().optional().nullable(),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueDate: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema: PrismaSchema<Prisma.TaskUncheckedUpdateInput> = z
  .object({
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(4000).optional().nullable(),
    category: z.string().max(200).optional().nullable(),
    locationId: z.string().uuid().optional().nullable(),
    cycleId: z.string().uuid().optional().nullable(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: z.coerce.date().optional().nullable(),
    startDate: z.coerce.date().optional().nullable(),
    completedAt: z.coerce.date().optional().nullable(),
    assigneeId: z.string().uuid().optional().nullable(),
  })
  .strict();

export const taskTimelineQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: taskStatusSchema.optional(),
  assigneeId: z.string().uuid().optional(),
  cycleId: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(500).default(200),
});
