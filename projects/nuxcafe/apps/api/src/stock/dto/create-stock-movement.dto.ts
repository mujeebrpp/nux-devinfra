import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { StockMovementType } from "@prisma/client";

export class CreateStockMovementDto {
  /** Slug of the ingredient the movement applies to. */
  @IsString()
  ingredientSlug: string;

  /**
   * PURCHASE and WASTE expect a positive `quantity` (added / removed).
   * ADJUSTMENT expects a signed delta applied to the on-hand amount.
   */
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;

  /** Free-form reference, e.g. a delivery note or order number. */
  @IsOptional()
  @IsString()
  reference?: string;
}
