import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaSchema } from "../../common/schemas/common.schemas";

export const inventoryCategorySchema = z.enum([
  "SEED",
  "SUBSTRATE",
  "TOOL",
  "PACKAGING",
  "CHEMICAL",
  "OTHER",
]);

export const createItemSchema: PrismaSchema<
  Omit<Prisma.InventoryItemUncheckedCreateInput, "farmId">
> =
  z.object({
    name: z.string().min(1).max(300),
    sku: z.string().max(100).optional().nullable(),
    category: inventoryCategorySchema.default("OTHER"),
    unit: z.string().min(1).max(50).default("pcs"),
    quantity: z.coerce.number().nonnegative().default(0),
    minQuantity: z.coerce.number().nonnegative().optional().nullable(),
    unitCost: z.coerce.number().nonnegative().optional().nullable(),
    locationId: z.string().uuid().optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
    active: z.boolean().default(true),
  });

export const updateItemSchema: PrismaSchema<Prisma.InventoryItemUncheckedUpdateInput> =
  z
    .object({
      name: z.string().min(1).max(300).optional(),
      sku: z.string().max(100).optional().nullable(),
      category: inventoryCategorySchema.optional(),
      unit: z.string().min(1).max(50).optional(),
      quantity: z.coerce.number().nonnegative().optional(),
      minQuantity: z.coerce.number().nonnegative().optional().nullable(),
      unitCost: z.coerce.number().nonnegative().optional().nullable(),
      locationId: z.string().uuid().optional().nullable(),
      notes: z.string().max(4000).optional().nullable(),
      active: z.boolean().optional(),
    })
    .strict();

export const createTransactionSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST"]),
  // Positive for IN/OUT; signed for ADJUST.
  quantity: z.coerce.number().refine((value) => value !== 0, {
    message: "quantity must not be zero",
  }),
  reference: z.string().max(300).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const inventoryQuerySchema = z.object({
  category: inventoryCategorySchema.optional(),
  lowStock: z.enum(["true", "false"]).optional(),
  includeInactive: z.enum(["true", "false"]).optional(),
});
