import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertRecipeDto } from "./dto/upsert-recipe.dto";

export interface RecipeItemDetail extends Prisma.RecipeItemGetPayload<{
  include: { ingredient: true };
}> {}

export interface RecipeDetail {
  id: string;
  items: RecipeItemDetail[];
  totalCostCents: number;
}

export interface RecipeByMenuItem {
  menuItem: Prisma.MenuItemGetPayload<{}>;
  recipe: RecipeDetail | null;
}

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get the recipe of a menu item by the menu item's slug. */
  async findByMenuItemSlug(menuItemSlug: string): Promise<RecipeByMenuItem> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { slug: menuItemSlug },
    });
    if (!menuItem) {
      throw new NotFoundException(`Menu item "${menuItemSlug}" not found`);
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { menuItemId: menuItem.id },
      include: {
        items: {
          include: { ingredient: true },
          orderBy: { ingredient: { name: "asc" } },
        },
      },
    });

    return {
      menuItem,
      recipe: recipe ? this.toDetail(recipe.items) : null,
    };
  }

  /** Replace the recipe of a menu item (creates it when missing). */
  async upsert(
    menuItemSlug: string,
    dto: UpsertRecipeDto,
  ): Promise<RecipeByMenuItem> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { slug: menuItemSlug },
    });
    if (!menuItem) {
      throw new NotFoundException(`Menu item "${menuItemSlug}" not found`);
    }

    if (dto.items.length === 0) {
      throw new BadRequestException("A recipe needs at least one item");
    }

    const ingredients = await this.prisma.ingredient.findMany({
      where: { slug: { in: dto.items.map((item) => item.ingredientSlug) } },
    });
    const bySlug = new Map(ingredients.map((i) => [i.slug, i]));

    const seen = new Set<string>();
    const rows: { ingredientId: string; quantity: number }[] = [];
    for (const item of dto.items) {
      const ingredient = bySlug.get(item.ingredientSlug);
      if (!ingredient) {
        throw new BadRequestException(
          `Ingredient "${item.ingredientSlug}" not found`,
        );
      }
      if (seen.has(ingredient.slug)) {
        throw new BadRequestException(
          `Duplicate ingredient "${ingredient.slug}" in recipe`,
        );
      }
      seen.add(ingredient.slug);
      rows.push({ ingredientId: ingredient.id, quantity: item.quantity });
    }

    const recipe = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.recipe.findUnique({
        where: { menuItemId: menuItem.id },
      });

      if (existing) {
        await tx.recipeItem.deleteMany({ where: { recipeId: existing.id } });
        return tx.recipe.update({
          where: { id: existing.id },
          data: { items: { create: rows } },
          include: {
            items: {
              include: { ingredient: true },
              orderBy: { ingredient: { name: "asc" } },
            },
          },
        });
      }

      return tx.recipe.create({
        data: { menuItemId: menuItem.id, items: { create: rows } },
        include: {
          items: {
            include: { ingredient: true },
            orderBy: { ingredient: { name: "asc" } },
          },
        },
      });
    });

    return {
      menuItem,
      recipe: this.toDetail(recipe.items),
    };
  }

  /** Remove the recipe of a menu item. */
  async remove(menuItemSlug: string): Promise<RecipeByMenuItem> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { slug: menuItemSlug },
    });
    if (!menuItem) {
      throw new NotFoundException(`Menu item "${menuItemSlug}" not found`);
    }

    await this.prisma.recipe.deleteMany({
      where: { menuItemId: menuItem.id },
    });

    return { menuItem, recipe: null };
  }

  private toDetail(items: RecipeItemDetail[]): RecipeDetail {
    return {
      id: items[0]?.recipeId ?? "",
      items,
      totalCostCents: items.reduce(
        (sum, item) => sum + Math.round(item.ingredient.costCents * item.quantity),
        0,
      ),
    };
  }
}
