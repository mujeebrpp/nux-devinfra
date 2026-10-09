import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.API_PORT) || 3091;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3090";

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: appUrl
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  });

  await app.listen(port);
  console.log(`NuxWell API listening on http://localhost:${port}/api`);
}

void bootstrap();
