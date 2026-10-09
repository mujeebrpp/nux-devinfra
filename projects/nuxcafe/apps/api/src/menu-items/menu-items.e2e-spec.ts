import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

describe("Menu items (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testSlug = "e2e-test-drink";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    // Mirrors the pipe configured in src/main.ts so validation
    // behaviour matches the running server.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
    await prisma.menuItem.deleteMany({ where: { slug: testSlug } });
  });

  afterAll(async () => {
    await prisma.menuItem.deleteMany({ where: { slug: testSlug } });
    await app.close();
  });

  it("POST /api/menu-items creates a menu item", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/menu-items")
      .send({
        name: "E2E Test Drink",
        description: "Created by the e2e suite",
        category: "COFFEE",
        priceCents: 450,
        prepMinutes: 4,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      slug: testSlug,
      name: "E2E Test Drink",
      category: "COFFEE",
      priceCents: 450,
      isActive: true,
    });
  });

  it("GET /api/menu-items lists active menu items with pagination", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/menu-items")
      .expect(200);

    expect(response.body.meta).toMatchObject({ page: 1, limit: 20 });
    const slugs: string[] = response.body.data.map(
      (item: { slug: string }) => item.slug,
    );
    expect(slugs).toContain(testSlug);
    expect(response.body.data[0]).toHaveProperty("recipe");
  });

  it("GET /api/menu-items supports search", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/menu-items?search=E2E%20Test")
      .expect(200);

    const slugs: string[] = response.body.data.map(
      (item: { slug: string }) => item.slug,
    );
    expect(slugs).toContain(testSlug);
  });

  it("GET /api/menu-items/:slug returns the item with its recipe", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/menu-items/${testSlug}`)
      .expect(200);

    expect(response.body.slug).toBe(testSlug);
    expect(response.body.recipe).toBeNull();
    expect(response.body.recipeCostCents).toBeNull();
  });

  it("PATCH /api/menu-items/:slug updates the item", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/menu-items/${testSlug}`)
      .send({ priceCents: 500 })
      .expect(200);

    expect(response.body.priceCents).toBe(500);
  });

  it("DELETE /api/menu-items/:slug removes the item", async () => {
    await request(app.getHttpServer())
      .delete(`/api/menu-items/${testSlug}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/menu-items/${testSlug}`)
      .expect(404);
  });

  it("rejects an invalid category with 400 (validation)", async () => {
    await request(app.getHttpServer())
      .post("/api/menu-items")
      .send({ name: "Bad", category: "NOT_A_CATEGORY", priceCents: 100 })
      .expect(400);
  });

  it("returns 404 for unknown slugs", async () => {
    await request(app.getHttpServer())
      .get("/api/menu-items/no-such-item")
      .expect(404);
  });
});
