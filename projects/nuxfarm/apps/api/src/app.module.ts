import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { UsersModule } from "./modules/users/users.module";
import { FarmsModule } from "./modules/farms/farms.module";
import { CyclesModule } from "./modules/cycles/cycles.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { IrrigationModule } from "./modules/irrigation/irrigation.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    UsersModule,
    FarmsModule,
    CyclesModule,
    TasksModule,
    IrrigationModule,
    InventoryModule,
    ReportsModule,
  ],
})
export class AppModule {}
