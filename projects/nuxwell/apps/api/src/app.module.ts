import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolveEnvFiles } from "./config/env";
import { FacilitiesModule } from "./facilities/facilities.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFiles(),
    }),
    PrismaModule,
    HealthModule,
    FacilitiesModule,
  ],
})
export class AppModule {}
