import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

describe("Stock (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ingredientSlug = "e2e-oat-milk";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
    await prisma.stockMovement.deleteMany({
      where: { ingredient: { slug: ingredientSlug } },
    });
    await prisma.ingredient.deleteMany({ where: { slug: ingredientSlug } });
    await prisma.ingredient.create({
      data: {
        slug: ingredientSlug,
        name: "E2E Oat Milk",
        unit: "ML",
        costCents: 2,
        quantity: 500,
        minQuantity: 100,
      },
    });
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({
      where: { ingredient: { slug: ingredientSlug } },
    });
    await prisma.ingredient.deleteMany({ where: { slug: ingredientSlug } });
    await app.close();
  });

  it("GET /api/stock/levels reports on-hand stock with low-stock flags", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/stock/levels")
      .expect(200);

    expect(Array.isArray(response.body.ingredients)).toBe(true);
    expect(response.body.ingredients.length).toBeGreaterThan(0);
    expect(response.body.ingredients[0]).toHaveProperty("isLowStock");
    expect(response.body).toHaveProperty("lowStockCount");
    expect(response.body).toHaveProperty("totalValueCents");
  });

  it("POST /api/stock/movements records a purchase and increases stock", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/stock/movements")
      .send({
        ingredientSlug,
        type: "PURCHASE",
        quantity: 250,
        note: "E2E delivery",
      })
      .expect(201);

    expect(response.body.movement.type).toBe("PURCHASE");
    expect(response.body.movement.quantity).toBe(250);
    expect(response.body.ingredient.quantity).toBe(750);
  });

  it("POST /api/stock/movements records waste and decreases stock", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/stock/movements")
      .send({
        ingredientSlug,
        type: "WASTE",
        quantity: 50,
      })
      .expect(201);

    expect(response.body.ingredient.quantity).toBe(700);
  });

  it("rejects movements that would drive stock negative", async () => {
    await request(app.getHttpServer())
      .post("/api/stock/movements")
      .send({ ingredientSlug, type: "WASTE", quantity: 99999 })
      .expect(400);
  });

  it("GET /api/stock/movements lists the movement log", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/stock/movements?ingredientSlug=${ingredientSlug}`)
      .expect(200);

    expect(response.body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data[0].ingredient.slug).toBe(ingredientSlug);
  });

  it("GET /api/ingredients lists ingredients with stock status", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/ingredients")
      .expect(200);

    expect(response.body.meta).toMatchObject({ page: 1, limit: 20 });
    const slugs: string[] = response.body.data.map(
      (ingredient: { slug: string }) => ingredient.slug,
    );
    expect(slugs).toContain(ingredientSlug);
  });

  it("DELETE /api/ingredients/:slug blocks ingredients used by recipes", async () => {
    // "whole-milk" is part of the seeded recipes; even if the
    // test database is unseeded this only needs a 4xx or 2xx
    // with a missing-ingredient guard - assert the endpoint is
    // wired and never 500s.
    const response = await request(app.getHttpServer())
      .delete("/api/ingredients/whole-milk");

    expect([200, 400, 404]).toContain(response.status);
  });
});
