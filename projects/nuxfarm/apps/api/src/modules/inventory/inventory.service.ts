import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateTransactionInput,
  createItemSchema,
  inventoryQuerySchema,
  updateItemSchema,
} from "./inventory.schemas";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(farmId: string, query: Record<string, string | undefined>) {
    const parsed = inventoryQuerySchema.parse(query);
    const where: Prisma.InventoryItemWhereInput = {
      farmId,
      ...(parsed.category ? { category: parsed.category } : {}),
      ...(parsed.includeInactive !== "true" ? { active: true } : {}),
      ...(parsed.lowStock === "true"
        ? { minQuantity: { not: null } }
        : {}),
    };
    return this.prisma.inventoryItem.findMany({
      where,
      include: { location: true, transactions: true },
      orderBy: { name: "asc" },
    });
  }

  async get(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        farm: true,
        location: true,
        transactions: { orderBy: { transactionAt: "desc" } },
      },
    });
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found.`);
    }
    return item;
  }

  async create(
    farmId: string,
    input: z.infer<typeof createItemSchema>,
  ) {
    if (input.locationId) {
      const location = await this.prisma.farmLocation.findUnique({
        where: { id: input.locationId },
      });
      if (!location || location.farmId !== farmId) {
        throw new BadRequestException(
          `Location ${input.locationId} not found on this farm.`,
        );
      }
    }
    try {
      const item = await this.prisma.inventoryItem.create({
        data: { ...input, farmId },
      });
      if (item.quantity !== 0) {
        await this.prisma.inventoryTransaction.create({
          data: {
            itemId: item.id,
            type: "IN",
            quantity: item.quantity,
            balanceAfter: item.quantity,
            reference: "INITIAL_STOCK",
          },
        });
      }
      return item;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          `An item with SKU "${input.sku}" already exists on this farm.`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: z.infer<typeof updateItemSchema>,
  ) {
    await this.get(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: input });
  }

  /**
   * Records a stock movement and updates the item quantity atomically.
   * IN adds, OUT subtracts (rejected when insufficient stock), ADJUST
   * applies a signed correction.
   */
  async createTransaction(
    itemId: string,
    input: CreateTransactionInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });
      if (!item) {
        throw new NotFoundException(`Inventory item ${itemId} not found.`);
      }

      let delta = 0;
      if (input.type === "IN") {
        if (input.quantity < 0) {
          throw new BadRequestException(
            "IN transactions require a positive quantity.",
          );
        }
        delta = input.quantity;
      } else if (input.type === "OUT") {
        if (input.quantity < 0) {
          throw new BadRequestException(
            "OUT transactions require a positive quantity.",
          );
        }
        delta = -input.quantity;
      } else {
        delta = input.quantity;
      }

      const balanceAfter = item.quantity + delta;
      if (balanceAfter < 0) {
        throw new BadRequestException(
          `Insufficient stock: ${item.quantity} ${item.unit} available, ${input.quantity} requested.`,
        );
      }

      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId: item.id,
          type: input.type,
          quantity: input.type === "ADJUST" ? input.quantity : delta,
          balanceAfter,
          reference: input.reference,
          notes: input.notes,
        },
      });

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: balanceAfter },
      });

      return { item: updated, transaction };
    });
  }

  lowStock(farmId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        farmId,
        active: true,
        minQuantity: { not: null },
      },
      include: { location: true },
      orderBy: { name: "asc" },
    });
  }
}
