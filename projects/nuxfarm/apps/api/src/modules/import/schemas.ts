import { z } from "zod";

/**
 * CSV import row schema - validates individual rows during import operations.
 * Each row must have the required fields based on the target entity type.
 */
export const csvImportRowSchema = z.object({
  // Generic fields that apply to most import operations
  farmId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  cycleId: z.string().uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "SKIPPED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.date().optional(),
  startDate: z.date().optional(),
  completedAt: z.date().optional(),
  notes: z.string().max(500).optional(),
  method: z.enum(["DRIP", "SPRINKLER", "FLOOD", "MANUAL", "OTHER"]).optional(),
  durationMinutes: z.number().min(0).optional(),
  volumeLiters: z.number().optional(),
  sku: z.string().optional(),
  quantity: z.number().optional(),
  unitCost: z.number().optional(),
  minQuantity: z.number().optional(),
  unit: z.string().optional(),
  kind: z.enum(["FIELD", "GREENHOUSE", "HIGH_TUNNEL", "SHADE_House", "NURSERY", "STORAGE", "OTHER"]).optional(),
  areaSqm: z.number().optional(),
  code: z.string().optional(),
  crop: z.string().optional(),
  variety: z.string().optional(),
  plantingMethod: z.string().optional(),
  irrigatedAt: z.date().optional(),
  irrigationMethod: z.enum(["DRIP", "SPRINKLER", "FLOOD", "MANUAL", "OTHER"]).optional(),
});

/**
 * JSON import schema - validates the structure of JSON import data.
 */
export const jsonImportSchema = z.object({
  source: z.string().min(1).max(100).optional(),
  format: z.string().min(1).max(50).optional(),
  version: z.string().optional(),
  data: z.array(z.object({
    farmId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    cycleId: z.string().uuid().optional(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(500).optional(),
    category: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "SKIPPED"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: z.date().optional(),
    startDate: z.date().optional(),
    completedAt: z.date().optional(),
    notes: z.string().max(500).optional(),
    method: z.enum(["DRIP", "SPRINKLER", "FLOOD", "MANUAL", "OTHER"]).optional(),
    durationMinutes: z.number().min(0).optional(),
    volumeLiters: z.number().optional(),
    sku: z.string().optional(),
    quantity: z.number().optional(),
    unitCost: z.number().optional(),
    minQuantity: z.number().optional(),
    unit: z.string().optional(),
    kind: z.enum(["FIELD", "GREENHOUSE", "HIGH_TUNNEL", "SHADE_House", "NURSERY", "STORAGE", "OTHER"]).optional(),
    areaSqm: z.number().optional(),
    code: z.string().optional(),
    crop: z.string().optional(),
    variety: z.string().optional(),
    plantingMethod: z.string().optional(),
    irrigatedAt: z.date().optional(),
    transactions: z.array(z.object({
      type: z.enum(["IN", "OUT", "ADJUST"]),
      quantity: z.number(),
      reference: z.string().optional(),
      notes: z.string().optional(),
    })),
  })),
});

/**
 * Import validation result schema - indicates whether the import is valid or has errors.
 */
export const importValidationResultSchema = z.object({
  valid: z.boolean(),
  totalRows: z.number(),
  validRows: z.number(),
  errorRows: z.number(),
  errors: z.array(z.object({
    row: z.number(),
    message: z.string(),
    fields: z.object({}).passthrough(),
  })),
});

/**
 * Import operation type - determines what kind of import is being performed.
 */
export const importOperationSchema = z.enum([
  "FARMS",
  "LOCATIONS",
  "CYCLES",
  "STAGES",
  "TASKS",
  "IRRIGATION",
  "INVENTORY",
  "REPORTS",
]);
