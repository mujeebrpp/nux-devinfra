import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateBookingDto {
  /** ISO date string for the start of the booking window */
  @IsDateString()
  startsAt: string;

  /** ISO date string for the end of the booking window */
  @IsDateString()
  endsAt: string;

  /** UUID of the facility */
  @IsString()
  facilityId: string;

  /** UUID of the service */
  @IsString()
  serviceId: string;

  /** UUID of the user */
  @IsString()
  userId: string;
}