import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3093),
  API_PORT: z.coerce.number().int().positive().default(3093),
  CORS_ORIGINS: z.string().default("http://localhost:3092"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(
  env: Record<string, string | undefined>,
): EnvConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return result.data;
}
