import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

describe("Facilities (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testSlugs = ["e2e-test-gym", "e2e-test-gym-inactive"];

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

    // Isolated fixtures for this suite, cleaned up in afterAll.
    await prisma.facility.deleteMany({ where: { slug: { in: testSlugs } } });
    await prisma.facility.create({
      data: {
        slug: "e2e-test-gym",
        name: "E2E Test Gym",
        type: "GYM",
        location: "Test Wing",
        capacity: 10,
      },
    });
    await prisma.facility.create({
      data: {
        slug: "e2e-test-gym-inactive",
        name: "E2E Test Gym (Inactive)",
        type: "GYM",
        location: "Test Wing",
        capacity: 10,
        isActive: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.facility.deleteMany({ where: { slug: { in: testSlugs } } });
    await app.close();
  });

  it("GET /api/facilities lists facilities (active only by default)", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/facilities")
      .expect(200);

    expect(response.body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(Array.isArray(response.body.data)).toBe(true);

    const slugs: string[] = response.body.data.map(
      (facility: { slug: string }) => facility.slug,
    );
    expect(slugs).toContain("e2e-test-gym");
    expect(slugs).not.toContain("e2e-test-gym-inactive");
  });

  it("GET /api/facilities supports search and includes inactive when requested", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/facilities?search=E2E&includeInactive=true")
      .expect(200);

    const slugs: string[] = response.body.data.map(
      (facility: { slug: string }) => facility.slug,
    );
    expect(slugs).toContain("e2e-test-gym");
    expect(slugs).toContain("e2e-test-gym-inactive");
  });

  it("GET /api/facilities/:slug returns a facility with its services", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/facilities/e2e-test-gym")
      .expect(200);

    expect(response.body.slug).toBe("e2e-test-gym");
    expect(Array.isArray(response.body.services)).toBe(true);
  });

  it("GET /api/facilities/:slug returns 404 for unknown slugs", async () => {
    await request(app.getHttpServer())
      .get("/api/facilities/no-such-facility")
      .expect(404);
  });

  it("rejects invalid query parameters with 400 (validation)", async () => {
    await request(app.getHttpServer())
      .get("/api/facilities?limit=not-a-number")
      .expect(400);
  });
});
