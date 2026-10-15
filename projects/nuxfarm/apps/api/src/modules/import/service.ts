import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const prisma: PrismaClient;
import { csvImportRowSchema, jsonImportSchema, importValidationResultSchema, importOperationSchema } from "./schemas";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const prisma: PrismaClient;
import { csvImportRowSchema, jsonImportSchema, importValidationResultSchema, importOperationSchema } from "./schemas";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import { PrismaClient } from "@prisma/client";

/**
 * Executes an import operation after validation.
 * @param data - The import data to process
 * @param operation - The type of import operation
 * @returns Result summary of the import operation
 */
function executeImport(data: unknown, operation: string): {
  success: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  created: number;
  errors: unknown[];
} {
  const validation = validateImportData(data, operation);

  if (!validation.valid) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      errorRows: validation.errorRows,
      created: 0,
      errors: validation.errors,
    };
  }

  const rows = jsonImportSchema.safeParse(data).data!.data;
  let created: number = 0;
  const errors: unknown[] = [];

  // Process each row with idempotent logic
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let createInput: any;

    switch (operation) {
      case "FARMS":
        createInput = {
          name: row.name,
          code: row.code,
          description: row.description,
          timezone: row.timezone,
          active: row.active ?? true,
          address: row.address,
        };
        break;
      case "LOCATIONS":
        createInput = {
          farmId: row.farmId,
          name: row.name,
          code: row.code,
          kind: row.kind,
          areaSqm: row.areaSqm,
          description: row.description,
          active: row.active ?? true,
        };
        break;
      case "CYCLES":
        createInput = {
          farmId: row.farmId,
          locationId: row.locationId,
          name: row.name,
          crop: row.crop,
          variety: row.variety,
          status: row.status,
          startDate: row.startDate,
          expectedEndDate: row.expectedEndDate,
          plantingMethod: row.plantingMethod,
          notes: row.notes,
        };
        break;
      case "TASKS":
        // Idempotent task creation - check if task with same title and farm already exists
        const existingTask = await prisma.task.findFirst({
          where: {
            farmId: row.farmId,
            title: row.title,
            locationId: row.locationId,
          },
        });

        if (existingTask) {
          // Skip duplicate - idempotent behavior
          continue;
        }

        createInput = {
          farmId: row.farmId,
          locationId: row.locationId,
          cycleId: row.cycleId,
          title: row.title,
          description: row.description,
          category: row.category,
          status: row.status,
          priority: row.priority,
          dueDate: row.dueDate,
          startDate: row.startDate,
          completedAt: row.completedAt,
          assigneeId: row.assigneeId,
        };
        break;
      case "IRRIGATION":
        createInput = {
          farmId: row.farmId,
          locationId: row.locationId,
          cycleId: row.cycleId,
          irrigatedAt: row.irrigatedAt,
          method: row.method,
          durationMinutes: row.durationMinutes,
          volumeLiters: row.volumeLiters,
          notes: row.notes,
        };
        break;
      case "INVENTORY":
        createInput = {
          farmId: row.farmId,
          locationId: row.locationId,
          name: row.name,
          sku: row.sku,
          category: row.category,
          unit: row.unit,
          quantity: row.quantity,
          minQuantity: row.minQuantity,
          unitCost: row.unitCost,
          active: row.active ?? true,
        };
        break;
      case "REPORTS":
        createInput = {
          farmId: row.farmId,
          type: row.type,
          title: row.title,
          periodStart: row.periodStart,
          periodEnd: row.periodEnd,
          filtersJson: row.filtersJson,
          dataJson: row.dataJson,
        };
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    await prisma[operation.toLowerCase() + "s"].create({ data: createInput });
    created++;
  }

  return {
    success: true,
    totalRows: rows.length,
    validRows: rows.length,
    errorRows: errors.length,
    created,
    errors,
  };
}

/**
 * Validates import data based on the operation type.
 * @param data - The import data to validate
 * @param operation - The type of import operation (FARMS, LOCATIONS, etc.)
 * @returns Validation result with valid rows and error rows
 */
function validateImportData(data: unknown, operation: string): {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: unknown[];
} {
  let parsed: unknown;
  let errorRows: number = 0;

  try {
    switch (operation) {
      case "FARMS":
        parsed = jsonImportSchema.safeParse(data);
        break;
      case "LOCATIONS":
        parsed = jsonImportSchema.safeParse(data);
        break;
      case "CYCLES":
        parsed = jsonImportSchema.safeParse(data);
        break;
      case "STAGES":
        parsed = jsonImportSchema.safeParse(data);
        break;
      case "TASKS":
        parsed = jsonImportSchema.safeParse(data);
        break;
      case "IRRIGATION":
        parsed = jsonImportSchema.safeParse(data);
        break;
      case "INVENTORY":
        parsed = jsonImportSchema.safeParse(data);
        break;
      case "REPORTS":
        parsed = jsonImportSchema.safeParse(data);
        break;
      default:
        throw new Error(`Unknown import operation: ${operation}`);
    }

    if (!parsed.success) {
      return {
        valid: false,
        totalRows: 0,
        validRows: 0,
        errorRows: parsed.error.issues.length,
        errors: [
          {
            row: 1,
            message: "Validation failed",
            fields: parsed.error.issues.map((issue: any) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
        ],
      };
    }

    const rows = parsed.data.data || [];
    return {
      valid: true,
      totalRows: rows.length,
      validRows: rows.length,
      errorRows: 0,
      errors: [],
    };
  } catch (error: any) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      errorRows: 1,
      errors: [
        {
          row: 1,
          message: error.message,
          fields: {},
        },
      ],
    };
  }
}