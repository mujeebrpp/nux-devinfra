import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaSchema } from "../../common/schemas/common.schemas";

export const createUserSchema: PrismaSchema<Prisma.UserUncheckedCreateInput> = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
  active: z.boolean().default(true),
});

export const updateUserSchema: PrismaSchema<Prisma.UserUncheckedUpdateInput> = z
  .object({
    email: z.string().email().optional(),
    name: z.string().min(1).max(200).optional(),
    role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
    active: z.boolean().optional(),
  })
  .strict();
