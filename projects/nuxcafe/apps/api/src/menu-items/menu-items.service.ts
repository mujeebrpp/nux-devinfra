import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { slugify } from "../common/util";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { MenuItemQueryDto } from "./dto/menu-item-query.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface MenuItemListResult {
  data: Prisma.MenuItemGetPayload<{
    include: {
      recipe: { include: { _count: { select: { items: true } } } };
    };
  }>[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class MenuItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MenuItemQueryDto): Promise<MenuItemListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const search = query.search?.trim();

    const where: Prisma.MenuItemWhereInput = {
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.category ? { category: query.category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ name: "asc" }, { slug: "asc" }],
        include: {
          recipe: { include: { _count: { select: { items: true } } } },
        },
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { slug },
      include: {
        recipe: {
          include: {
            items: {
              include: { ingredient: true },
              orderBy: { ingredient: { name: "asc" } },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Menu item "${slug}" not found`);
    }

    const recipeCostCents = item.recipe
      ? item.recipe.items.reduce(
          (sum, item) => sum + Math.round(item.ingredient.costCents * item.quantity),
          0,
        )
      : null;

    return { ...item, recipeCostCents };
  }

  async create(dto: CreateMenuItemDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    if (!slug) {
      throw new BadRequestException(
        "A slug could not be derived from the menu item name",
      );
    }

    return this.prisma.menuItem.create({
      data: { ...dto, slug },
    });
  }

  async update(slug: string, dto: UpdateMenuItemDto) {
    const existing = await this.prisma.menuItem.findUnique({
      where: { slug },
    });
    if (!existing) {
      throw new NotFoundException(`Menu item "${slug}" not found`);
    }

    const nextSlug = dto.slug?.trim() || existing.slug;
    return this.prisma.menuItem.update({
      where: { slug },
      data: { ...dto, slug: nextSlug },
    });
  }

  async remove(slug: string) {
    const existing = await this.prisma.menuItem.findUnique({
      where: { slug },
    });
    if (!existing) {
      throw new NotFoundException(`Menu item "${slug}" not found`);
    }

    // The recipe (and its items) cascades with the menu item.
    return this.prisma.menuItem.delete({ where: { slug } });
  }
}
