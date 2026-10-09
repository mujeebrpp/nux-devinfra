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
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { IngredientQueryDto } from "./dto/ingredient-query.dto";
import { UpdateIngredientDto } from "./dto/update-ingredient.dto";
import { IngredientsService } from "./ingredients.service";

@Controller("ingredients")
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  /** List ingredients with search, unit filter and pagination. */
  @Get()
  findAll(@Query() query: IngredientQueryDto) {
    return this.ingredientsService.list(query);
  }

  /** Create an ingredient with its opening stock amount. */
  @Post()
  create(@Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(dto);
  }

  /** Get an ingredient by slug, including stock status. */
  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.ingredientsService.findBySlug(slug);
  }

  /** Update an ingredient. */
  @Patch(":slug")
  update(@Param("slug") slug: string, @Body() dto: UpdateIngredientDto) {
    return this.ingredientsService.update(slug, dto);
  }

  /** Delete an ingredient that is not used by any recipe. */
  @Delete(":slug")
  remove(@Param("slug") slug: string) {
    return this.ingredientsService.remove(slug);
  }
}
