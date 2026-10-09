import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ProductionStatus } from "@prisma/client";

export class ProductionQueryDto {
  /** Filter by production status. */
  @IsOptional()
  @IsEnum(ProductionStatus)
  status?: ProductionStatus;

  /** Filter by menu item slug. */
  @IsOptional()
  @IsString()
  menuItemSlug?: string;

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
