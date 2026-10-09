import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { HealthService } from "./health.service";

describe("HealthService", () => {
  let service: HealthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(HealthService);
    prisma = moduleRef.get(PrismaService);
  });

  it("reports ok when the database round-trip succeeds", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ "?column?": 1 }]);

    const status = await service.getHealth();

    expect(status).toEqual({
      status: "ok",
      database: "ok",
      timestamp: expect.any(String),
    });
  });

  it("reports a database error when the round-trip fails", async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("db down"));

    const status = await service.getHealth();

    expect(status.status).toBe("error");
    expect(status.database).toBe("error");
  });
});
