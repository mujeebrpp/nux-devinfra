import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

describe("Production (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const menuItemSlug = "e2e-production-item";

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
    await prisma.production.deleteMany({
      where: { menuItem: { slug: menuItemSlug } },
    });
    await prisma.menuItem.deleteMany({ where: { slug: menuItemSlug } });
    await prisma.menuItem.create({
      data: {
        slug: menuItemSlug,
        name: "E2E Production Item",
        category: "PASTRY",
        priceCents: 350,
      },
    });
  });

  afterAll(async () => {
    await prisma.production.deleteMany({
      where: { menuItem: { slug: menuItemSlug } },
    });
    await prisma.menuItem.deleteMany({ where: { slug: menuItemSlug } });
    await app.close();
  });

  it("POST /api/production queues a manual production run", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/production")
      .send({ menuItemSlug, quantity: 3 })
      .expect(201);

    expect(response.body).toMatchObject({
      status: "QUEUED",
      quantity: 3,
    });
    expect(response.body.menuItem.slug).toBe(menuItemSlug);

    (globalThis as Record<string, unknown>).__e2eProductionId =
      response.body.id;
  });

  it("GET /api/production lists runs with a status filter", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/production?status=QUEUED")
      .expect(200);

    expect(response.body.meta).toMatchObject({ page: 1, limit: 20 });
    const statuses: string[] = response.body.data.map(
      (production: { status: string }) => production.status,
    );
    expect(statuses).not.toContain("COMPLETED");
  });

  it("POST /api/production/:id/complete completes a queued run", async () => {
    const productionId = (globalThis as Record<string, unknown>)
      .__e2eProductionId as string;

    const response = await request(app.getHttpServer())
      .post(`/api/production/${productionId}/complete`)
      .expect(200);

    expect(response.body.status).toBe("COMPLETED");
    expect(response.body.completedAt).not.toBeNull();
  });

  it("rejects completing an already completed run", async () => {
    const productionId = (globalThis as Record<string, unknown>)
      .__e2eProductionId as string;

    await request(app.getHttpServer())
      .post(`/api/production/${productionId}/complete`)
      .expect(400);
  });

  it("POST /api/production/:id/cancel cancels an active run", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/api/production")
      .send({ menuItemSlug, quantity: 1 })
      .expect(201);

    const cancelResponse = await request(app.getHttpServer())
      .post(`/api/production/${createResponse.body.id}/cancel`)
      .expect(200);

    expect(cancelResponse.body.status).toBe("CANCELLED");
  });

  it("returns 404 for unknown production ids", async () => {
    await request(app.getHttpServer())
      .get("/api/production/no-such-run")
      .expect(404);
  });
});
