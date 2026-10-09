import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { FacilityQueryDto } from "./dto/facility-query.dto";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type FacilityWithServiceCount = Prisma.FacilityGetPayload<{
  include: { _count: { select: { services: true } } };
}>;

export interface FacilityListResult {
  data: FacilityWithServiceCount[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class FacilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FacilityQueryDto): Promise<FacilityListResult> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const search = query.search?.trim();
    const activeOnly = !(query.includeInactive ?? false);

    const where: Prisma.FacilityWhereInput = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.facility.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ name: "asc" }, { slug: "asc" }],
        include: { _count: { select: { services: true } } },
      }),
      this.prisma.facility.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!facility) {
      throw new NotFoundException(`Facility "${slug}" not found`);
    }

    return facility;
  }
}
