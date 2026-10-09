import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
} from "@nestjs/common";
import { UpsertRecipeDto } from "./dto/upsert-recipe.dto";
import { RecipesService } from "./recipes.service";

@Controller("recipes")
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  /** Get the recipe of a menu item by menu item slug. */
  @Get(":menuItemSlug")
  findByMenuItemSlug(@Param("menuItemSlug") menuItemSlug: string) {
    return this.recipesService.findByMenuItemSlug(menuItemSlug);
  }

  /** Create or fully replace the recipe of a menu item. */
  @HttpCode(200)
  @Put(":menuItemSlug")
  upsert(
    @Param("menuItemSlug") menuItemSlug: string,
    @Body() dto: UpsertRecipeDto,
  ) {
    return this.recipesService.upsert(menuItemSlug, dto);
  }

  /** Remove the recipe of a menu item. */
  @Delete(":menuItemSlug")
  remove(@Param("menuItemSlug") menuItemSlug: string) {
    return this.recipesService.remove(menuItemSlug);
  }
}
