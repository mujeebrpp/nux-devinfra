import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateProductionDto {
  /** Slug of the menu item to produce. */
  @IsString()
  menuItemSlug: string;

  /** Number of portions to produce. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity?: number;

  /** Optional order this run belongs to (set automatically for order lines). */
  @IsOptional()
  @IsString()
  orderId?: string;
}
