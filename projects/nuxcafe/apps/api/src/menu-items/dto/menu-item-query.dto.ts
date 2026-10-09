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
import { MenuItemCategory } from "@prisma/client";

export class MenuItemQueryDto {
  /** Case-insensitive substring filter on name and description. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MenuItemCategory)
  category?: MenuItemCategory;

  /** Include inactive menu items. Defaults to false (active only). */
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
