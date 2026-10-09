import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { MenuItemQueryDto } from "./dto/menu-item-query.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";
import { MenuItemsService } from "./menu-items.service";

@Controller("menu-items")
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  /** List menu items with search, category filter and pagination. */
  @Get()
  findAll(@Query() query: MenuItemQueryDto) {
    return this.menuItemsService.list(query);
  }

  /** Create a menu item. */
  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuItemsService.create(dto);
  }

  /** Get a menu item by slug, including its recipe. */
  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.menuItemsService.findBySlug(slug);
  }

  /** Update a menu item. */
  @Patch(":slug")
  update(@Param("slug") slug: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuItemsService.update(slug, dto);
  }

  /** Delete a menu item and its recipe. */
  @Delete(":slug")
  remove(@Param("slug") slug: string) {
    return this.menuItemsService.remove(slug);
  }
}
