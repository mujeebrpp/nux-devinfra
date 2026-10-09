import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

describe("Sales and dashboard (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ingredientSlug = "e2e-sales-beans";
  const menuItemSlug = "e2e-sales-latte";

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

    await cleanupFixtures();
    await seedFixtures();
  });

  afterAll(async () => {
    await cleanupFixtures();
    await app.close();
  });

  async function cleanupFixtures(): Promise<void> {
    await prisma.sale.deleteMany({
      where: {
        order: { items: { some: { menuItem: { slug: menuItemSlug } } } },
      },
    });
    await prisma.production.deleteMany({
      where: { menuItem: { slug: menuItemSlug } },
    });
    await prisma.orderItem.deleteMany({
      where: { menuItem: { slug: menuItemSlug } },
    });
    await prisma.order.deleteMany({
      where: { items: { some: { menuItem: { slug: menuItemSlug } } } },
    });
    await prisma.stockMovement.deleteMany({
      where: { ingredient: { slug: ingredientSlug } },
    });
    await prisma.recipeItem.deleteMany({
      where: { ingredient: { slug: ingredientSlug } },
    });
    await prisma.recipe.deleteMany({
      where: { menuItem: { slug: menuItemSlug } },
    });
    await prisma.menuItem.deleteMany({ where: { slug: menuItemSlug } });
    await prisma.ingredient.deleteMany({ where: { slug: ingredientSlug } });
  }

  async function seedFixtures(): Promise<void> {
    await prisma.ingredient.create({
      data: {
        slug: ingredientSlug,
        name: "E2E Sales Beans",
        unit: "G",
        costCents: 3,
        quantity: 1000,
        minQuantity: 100,
      },
    });
    await prisma.menuItem.create({
      data: {
        slug: menuItemSlug,
        name: "E2E Sales Latte",
        category: "COFFEE",
        priceCents: 600,
      },
    });
    const menuItem = await prisma.menuItem.findUniqueOrThrow({
      where: { slug: menuItemSlug },
    });
    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { slug: ingredientSlug },
    });
    await prisma.recipe.create({
      data: {
        menuItemId: menuItem.id,
        items: { create: [{ ingredientId: ingredient.id, quantity: 10 }] },
      },
    });
  }

  it("completing an order makes it appear in the sales summary", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/api/orders")
      .send({ items: [{ menuItemSlug, quantity: 2 }] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/orders/${createResponse.body.id}/complete`)
      .expect(200);

    const summary = await request(app.getHttpServer())
      .get("/api/sales/summary")
      .expect(200);

    expect(summary.body).toMatchObject({
      today: expect.objectContaining({
        amountCents: expect.any(Number),
        orders: expect.any(Number),
        date: expect.any(String),
      }),
    });
    expect(summary.body.last7Days).toHaveLength(7);
    // The completed order was worth 2 x 600 cents.
    expect(summary.body.today.amountCents).toBeGreaterThanOrEqual(1200);
  });

  it("GET /api/sales lists sales newest first", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/sales")
      .expect(200);

    expect(response.body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(response.body.data.length).toBeGreaterThan(0);
    const first = response.body.data[0];
    expect(first).toHaveProperty("amountCents");
    expect(first).toHaveProperty("itemsCount");
    expect(first.order).toHaveProperty("number");
  });

  it("GET /api/dashboard returns the aggregate overview", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/dashboard")
      .expect(200);

    expect(response.body).toMatchObject({
      today: expect.objectContaining({
        revenueCents: expect.any(Number),
        salesCount: expect.any(Number),
        ordersCount: expect.any(Number),
      }),
      kitchen: expect.objectContaining({
        queued: expect.any(Number),
        inProgress: expect.any(Number),
      }),
      counts: expect.objectContaining({
        menuItems: expect.any(Number),
        ingredients: expect.any(Number),
        recipes: expect.any(Number),
      }),
    });
    expect(Array.isArray(response.body.lowStock)).toBe(true);
    expect(Array.isArray(response.body.recentOrders)).toBe(true);
  });

  it("GET /api/dashboard flags the low-stock ingredient", async () => {
    // Drain the fixture ingredient below its minimum.
    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { slug: ingredientSlug },
    });
    await prisma.ingredient.update({
      where: { id: ingredient.id },
      data: { quantity: 5 },
    });

    const response = await request(app.getHttpServer())
      .get("/api/dashboard")
      .expect(200);

    const slugs: string[] = response.body.lowStock.map(
      (item: { slug: string }) => item.slug,
    );
    expect(slugs).toContain(ingredientSlug);
  });
});
