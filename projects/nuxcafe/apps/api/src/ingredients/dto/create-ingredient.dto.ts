import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { IngredientUnit } from "@prisma/client";

export class CreateIngredientDto {
  /** Display name, e.g. "Whole Milk". */
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsEnum(IngredientUnit)
  unit: IngredientUnit;

  /** Cost per unit in cents. */
  @IsInt()
  @Min(0)
  costCents: number;

  /** Opening on-hand amount in `unit`. */
  @IsOptional()
  @Min(0)
  quantity?: number;

  /** Level at or below which the ingredient is flagged low. */
  @IsOptional()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
