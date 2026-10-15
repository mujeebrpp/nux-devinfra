import { IsBoolean, IsOptional, IsString, Min } from "class-validator";

export class FindAllBookingsDto {
  /** Filter by user ID */
  @IsOptional()
  @IsString()
  userId?: string;

  /** Filter by facility ID */
  @IsOptional()
  @IsString()
  facilityId?: string;

  /** Filter by service ID */
  @IsOptional()
  @IsString()
  serviceId?: string;

  /** Filter by status (PENDING, CONFIRMED, CANCELLED) */
  @IsOptional()
  @IsString()
  status?: string;

  /** Include inactive bookings (default: false) */
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;

  /** Pagination page (default: 1) */
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Pagination limit (default: 20, max: 100) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}