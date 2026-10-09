import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolveEnvFiles } from "./config/env";
import { DashboardModule } from "./dashboard/dashboard.module";
import { HealthModule } from "./health/health.module";
import { IngredientsModule } from "./ingredients/ingredients.module";
import { MenuItemsModule } from "./menu-items/menu-items.module";
import { OrdersModule } from "./orders/orders.module";
import { ProductionModule } from "./production/production.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RecipesModule } from "./recipes/recipes.module";
import { SalesModule } from "./sales/sales.module";
import { StockModule } from "./stock/stock.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFiles(),
    }),
    PrismaModule,
    HealthModule,
    MenuItemsModule,
    IngredientsModule,
    RecipesModule,
    StockModule,
    ProductionModule,
    OrdersModule,
    SalesModule,
    DashboardModule,
  ],
})
export class AppModule {}
