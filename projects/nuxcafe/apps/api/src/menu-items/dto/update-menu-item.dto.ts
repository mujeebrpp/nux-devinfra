import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { MenuItemCategory } from "@prisma/client";

/** All fields optional; only provided fields are updated. */
export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(MenuItemCategory)
  category?: MenuItemCategory;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  prepMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
