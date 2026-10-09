import { defineConfig } from "prisma/config";

// Only pin the schema location. The datasource URL stays in
// prisma/schema.prisma (env("DATABASE_URL")) so Prisma keeps loading
// apps/api/.env as usual.
export default defineConfig({ schema: "prisma/schema.prisma" });