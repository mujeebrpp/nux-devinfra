import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

describe("Orders (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Isolated fixtures for this suite, cleaned up in afterAll.
  const ingredientSlug = "e2e-beans";
  const menuItemSlug = "e2e-cafe-latte";

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
    const menuItems = await prisma.menuItem.findMany({
      where: { slug: menuItemSlug },
    });
    for (const menuItem of menuItems) {
      await prisma.production.deleteMany({
        where: { menuItemId: menuItem.id },
      });
    }
    await prisma.sale.deleteMany({
      where: { order: { items: { some: { menuItem: { slug: menuItemSlug } } } } },
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
        name: "E2E Espresso Beans",
        unit: "G",
        costCents: 3,
        quantity: 1000,
        minQuantity: 100,
      },
    });

    await prisma.menuItem.create({
      data: {
        slug: menuItemSlug,
        name: "E2E Cafe Latte",
        category: "COFFEE",
        priceCents: 500,
        prepMinutes: 4,
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
        items: {
          create: [{ ingredientId: ingredient.id, quantity: 18 }],
        },
      },
    });
  }

  it("POST /api/orders creates an order with queued production runs", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/orders")
      .send({ items: [{ menuItemSlug, quantity: 2 }] })
      .expect(201);

    expect(response.body).toMatchObject({
      status: "PENDING",
      totalCents: 1000,
    });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      quantity: 2,
      priceCents: 500,
    });
    expect(response.body.productions).toHaveLength(1);
    expect(response.body.productions[0].status).toBe("QUEUED");

    // Stash the order id for the follow-up tests in this file.
    (globalThis as Record<string, unknown>).__e2eOrderId =
      response.body.id;
  });

  it("POST /api/orders rejects unknown menu items", async () => {
    await request(app.getHttpServer())
      .post("/api/orders")
      .send({ items: [{ menuItemSlug: "no-such-item", quantity: 1 }] })
      .expect(400);
  });

  it("POST /api/orders/:id/complete consumes stock and records a sale", async () => {
    const orderId = (globalThis as Record<string, unknown>)
      .__e2eOrderId as string;

    const before = await prisma.ingredient.findUniqueOrThrow({
      where: { slug: ingredientSlug },
    });

    const response = await request(app.getHttpServer())
      .post(`/api/orders/${orderId}/complete`)
      .expect(200);

    expect(response.body.status).toBe("COMPLETED");
    expect(response.body.sale).toMatchObject({
      amountCents: 1000,
      itemsCount: 2,
    });

    // 2 portions x 18g per portion = 36g consumed.
    const after = await prisma.ingredient.findUniqueOrThrow({
      where: { slug: ingredientSlug },
    });
    expect(after.quantity).toBe(before.quantity - 36);

    const usage = await prisma.stockMovement.findMany({
      where: {
        ingredient: { slug: ingredientSlug },
        type: "USAGE",
      },
    });
    expect(usage).toHaveLength(1);
    expect(usage[0].quantity).toBe(36);

    const saleCount = await prisma.sale.count({ where: { orderId } });
    expect(saleCount).toBe(1);
  });

  it("POST /api/orders/:id/complete rejects a second completion", async () => {
    const orderId = (globalThis as Record<string, unknown>)
      .__e2eOrderId as string;

    await request(app.getHttpServer())
      .post(`/api/orders/${orderId}/complete`)
      .expect(400);
  });

  it("POST /api/orders/:id/cancel cancels an order and its runs", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/api/orders")
      .send({ items: [{ menuItemSlug, quantity: 1 }] })
      .expect(201);

    const cancelResponse = await request(app.getHttpServer())
      .post(`/api/orders/${createResponse.body.id}/cancel`)
      .expect(200);

    expect(cancelResponse.body.status).toBe("CANCELLED");
    expect(cancelResponse.body.productions[0].status).toBe("CANCELLED");
  });
});
