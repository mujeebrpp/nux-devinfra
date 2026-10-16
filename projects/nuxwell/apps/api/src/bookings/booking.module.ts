import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: "dev-secret-change-in-production",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [BookingController],
  providers: [BookingService, JwtAuthGuard],
  exports: [BookingService],
})
export class BookingModule {}