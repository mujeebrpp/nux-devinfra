import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { IngredientUnit } from "@prisma/client";

export class IngredientQueryDto {
  /** Case-insensitive substring filter on name. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(IngredientUnit)
  unit?: IngredientUnit;

  /** Include inactive ingredients. Defaults to false. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
