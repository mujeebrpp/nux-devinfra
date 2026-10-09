import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface HealthStatus {
  status: "ok" | "error";
  database: "ok" | "error";
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Full health check including a live database round-trip. */
  async getHealth(): Promise<HealthStatus> {
    let database: HealthStatus["database"] = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "error";
    }

    return {
      status: database === "ok" ? "ok" : "error",
      database,
      timestamp: new Date().toISOString(),
    };
  }

  /** Lightweight liveness probe for orchestrators. */
  getReadiness(): { status: "ok"; timestamp: string } {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
