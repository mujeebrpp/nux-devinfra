import { Controller, Post, Get, Body, Param, Query, UseGuards, Patch, Delete } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { CreateBookingDto } from "./create-booking.dto";
import { FindAllBookingsDto } from "./find-all-query.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";

@Controller("bookings")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBookingDto, @User("user") user: any) {
    return this.bookingService.create({
      ...dto,
      userId: user.sub,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: FindAllBookingsDto, @User("user") user: any) {
    return this.bookingService.findAll({
      ...query,
      userId: user.sub,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findById(@Param("id") id: string, @User("user") user: any) {
    return this.bookingService.findById(id);
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  cancel(@Param("id") id: string, @User("user") user: any) {
    return this.bookingService.cancel(id, user.sub);
  }
}