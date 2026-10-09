import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaSchema } from "../../common/schemas/common.schemas";

const codeRegex = /^[A-Za-z0-9_-]+$/;

export const createFarmSchema: PrismaSchema<Prisma.FarmUncheckedCreateInput> =
  z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(50).regex(codeRegex),
    description: z.string().max(2000).optional().nullable(),
    timezone: z.string().default("UTC"),
    address: z.string().max(2000).optional().nullable(),
    active: z.boolean().default(true),
  });

export const updateFarmSchema: PrismaSchema<Prisma.FarmUncheckedUpdateInput> = z
  .object({
    name: z.string().min(1).max(200).optional(),
    code: z.string().min(1).max(50).regex(codeRegex).optional(),
    description: z.string().max(2000).optional().nullable(),
    timezone: z.string().optional(),
    address: z.string().max(2000).optional().nullable(),
    active: z.boolean().optional(),
  })
  .strict();

export const createLocationSchema: PrismaSchema<
  Omit<Prisma.FarmLocationUncheckedCreateInput, "farmId">
> =
  z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(50).regex(codeRegex),
    kind: z
      .enum([
        "FIELD",
        "GREENHOUSE",
        "HIGH_TUNNEL",
        "SHADE_HOUSE",
        "NURSERY",
        "STORAGE",
        "OTHER",
      ])
      .default("FIELD"),
    areaSqm: z.coerce.number().nonnegative().optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    active: z.boolean().default(true),
  });

export const updateLocationSchema: PrismaSchema<Prisma.FarmLocationUncheckedUpdateInput> =
  z
    .object({
      name: z.string().min(1).max(200).optional(),
      code: z.string().min(1).max(50).regex(codeRegex).optional(),
      kind: z
        .enum([
          "FIELD",
          "GREENHOUSE",
          "HIGH_TUNNEL",
          "SHADE_HOUSE",
          "NURSERY",
          "STORAGE",
          "OTHER",
        ])
        .optional(),
      areaSqm: z.coerce.number().nonnegative().optional().nullable(),
      description: z.string().max(2000).optional().nullable(),
      active: z.boolean().optional(),
    })
    .strict();
