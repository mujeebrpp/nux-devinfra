import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { slugify } from "../common/util";
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { IngredientQueryDto } from "./dto/ingredient-query.dto";
import { UpdateIngredientDto } from "./dto/update-ingredient.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface IngredientWithStock extends Prisma.IngredientGetPayload<{}> {
  isLowStock: boolean;
}

export interface IngredientListResult {
  data: IngredientWithStock[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: IngredientQueryDto): Promise<IngredientListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const search = query.search?.trim();

    const where: Prisma.IngredientWhereInput = {
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.unit ? { unit: query.unit } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ name: "asc" }, { slug: "asc" }],
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return {
      data: data.map((ingredient) => ({
        ...ingredient,
        isLowStock: ingredient.quantity <= ingredient.minQuantity,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string): Promise<IngredientWithStock> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { slug },
    });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient "${slug}" not found`);
    }

    return {
      ...ingredient,
      isLowStock: ingredient.quantity <= ingredient.minQuantity,
    };
  }

  async create(dto: CreateIngredientDto): Promise<IngredientWithStock> {
    const slug = dto.slug?.trim() || slugify(dto.name);
    if (!slug) {
      throw new BadRequestException(
        "A slug could not be derived from the ingredient name",
      );
    }

    const ingredient = await this.prisma.ingredient.create({
      data: {
        ...dto,
        slug,
        quantity: dto.quantity ?? 0,
        minQuantity: dto.minQuantity ?? 0,
      },
    });

    return {
      ...ingredient,
      isLowStock: ingredient.quantity <= ingredient.minQuantity,
    };
  }

  async update(
    slug: string,
    dto: UpdateIngredientDto,
  ): Promise<IngredientWithStock> {
    const existing = await this.prisma.ingredient.findUnique({
      where: { slug },
    });
    if (!existing) {
      throw new NotFoundException(`Ingredient "${slug}" not found`);
    }

    const nextSlug = dto.slug?.trim() || existing.slug;
    const ingredient = await this.prisma.ingredient.update({
      where: { slug },
      data: { ...dto, slug: nextSlug },
    });

    return {
      ...ingredient,
      isLowStock: ingredient.quantity <= ingredient.minQuantity,
    };
  }

  async remove(slug: string) {
    const existing = await this.prisma.ingredient.findUnique({
      where: { slug },
      include: { recipeItems: true },
    });
    if (!existing) {
      throw new NotFoundException(`Ingredient "${slug}" not found`);
    }

    if (existing.recipeItems.length > 0) {
      throw new BadRequestException(
        `Ingredient "${slug}" is used by ${existing.recipeItems.length} recipe(s). ` +
          "Remove it from those recipes before deleting the ingredient.",
      );
    }

    return this.prisma.ingredient.delete({ where: { slug } });
  }
}
