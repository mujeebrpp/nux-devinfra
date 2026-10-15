import { Module } from "@nestjs/common";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BookingController],
  providers: [BookingService, JwtAuthGuard],
  exports: [BookingService],
})
export class BookingModule {}