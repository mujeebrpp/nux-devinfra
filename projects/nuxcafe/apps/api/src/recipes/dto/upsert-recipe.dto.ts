import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class RecipeItemDto {
  /** Slug of the ingredient used by the recipe. */
  @IsString()
  ingredientSlug: string;

  /** Amount of the ingredient (in its own unit) per portion. */
  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

export class UpsertRecipeDto {
  /** Full replacement list of recipe items. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}
