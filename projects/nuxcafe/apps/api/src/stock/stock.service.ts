import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, StockMovementType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto";
import { StockMovementQueryDto } from "./dto/stock-movement-query.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface StockLevel
  extends Prisma.IngredientGetPayload<{}> {
  isLowStock: boolean;
}

export interface StockLevelsResult {
  ingredients: StockLevel[];
  lowStockCount: number;
  totalValueCents: number;
}

/** Movement whose embedded ingredient carries the low-stock flag. */
export type StockMovementWithLevel = Prisma.StockMovementGetPayload<{
  include: { ingredient: true };
}> & { ingredient: StockLevel };

export interface StockMovementListResult {
  data: StockMovementWithLevel[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockMovementResult {
  movement: StockMovementWithLevel;
  ingredient: StockLevel;
}

/** Attach the low-stock flag to a movement's embedded ingredient. */
function withLowStock(
  movement: Prisma.StockMovementGetPayload<{
    include: { ingredient: true };
  }>,
): StockMovementWithLevel {
  return {
    ...movement,
    ingredient: {
      ...movement.ingredient,
      isLowStock:
        movement.ingredient.quantity <= movement.ingredient.minQuantity,
    },
  };
}

/** Signed stock delta for each movement type. */
function signedDelta(type: StockMovementType, quantity: number): number {
  switch (type) {
    case "PURCHASE":
      return quantity;
    case "USAGE":
    case "WASTE":
      return -quantity;
    case "ADJUSTMENT":
      return quantity;
  }
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /** Current on-hand stock for every active ingredient. */
  async getLevels(): Promise<StockLevelsResult> {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
    });

    const withFlags = ingredients.map((ingredient) => ({
      ...ingredient,
      isLowStock: ingredient.quantity <= ingredient.minQuantity,
    }));

    return {
      ingredients: withFlags,
      lowStockCount: withFlags.filter((i) => i.isLowStock).length,
      totalValueCents: Math.round(
        withFlags.reduce(
          (sum, i) => sum + i.costCents * i.quantity,
          0,
        ),
      ),
    };
  }

  /** Paginated, newest-first movement log with optional filters. */
  async listMovements(
    query: StockMovementQueryDto,
  ): Promise<StockMovementListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: Prisma.StockMovementWhereInput = {
      ...(query.ingredientSlug
        ? { ingredient: { slug: query.ingredientSlug } }
        : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: { ingredient: true },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: rows.map(withLowStock),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Apply a stock movement and record it in the log. */
  async createMovement(
    dto: CreateStockMovementDto,
  ): Promise<StockMovementResult> {
    if (dto.quantity <= 0) {
      throw new BadRequestException("Movement quantity must be greater than 0");
    }

    const ingredient = await this.prisma.ingredient.findUnique({
      where: { slug: dto.ingredientSlug },
    });
    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient "${dto.ingredientSlug}" not found`,
      );
    }

    const delta = signedDelta(dto.type, dto.quantity);
    const newQuantity = ingredient.quantity + delta;
    if (newQuantity < 0) {
      throw new BadRequestException(
        `Insufficient stock: "${ingredient.name}" has ${ingredient.quantity} ${ingredient.unit} on hand`,
      );
    }

    const [updated, movement] = await this.prisma.$transaction([
      this.prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { quantity: newQuantity },
      }),
      this.prisma.stockMovement.create({
        data: {
          ingredientId: ingredient.id,
          type: dto.type,
          quantity: dto.quantity,
          note: dto.note,
          reference: dto.reference,
        },
        include: { ingredient: true },
      }),
    ]);

    return {
      movement: withLowStock(movement),
      ingredient: {
        ...updated,
        isLowStock: updated.quantity <= updated.minQuantity,
      },
    };
  }
}
