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

export class CreateMenuItemDto {
  /** Display name, e.g. "Cappuccino". */
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Optional URL slug; derived from the name when omitted. */
  @IsOptional()
  @IsString()
  slug?: string;

  @IsEnum(MenuItemCategory)
  category: MenuItemCategory;

  /** Price in cents. */
  @IsInt()
  @Min(0)
  priceCents: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  prepMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
