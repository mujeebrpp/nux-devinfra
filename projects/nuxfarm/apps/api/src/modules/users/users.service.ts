import { z } from "zod";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  createUserSchema,
  updateUserSchema,
} from "./users.schemas";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }

  get(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(input: z.infer<typeof createUserSchema>) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new BadRequestException(`A user with email ${input.email} already exists.`);
    }
    return this.prisma.user.create({ data: input });
  }

  async update(id: string, input: z.infer<typeof updateUserSchema>) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }
    return this.prisma.user.update({ where: { id }, data: input });
  }
}
