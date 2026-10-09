import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { ZodError, ZodType } from "zod";

/**
 * Framework-free validation core. The pipe is a thin NestJS adapter so the
 * parsing logic stays unit-testable outside the Nest runtime.
 */
export function parseWithZod<T>(
  schema: ZodType<T>,
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ZodError(result.error.issues);
  }
  return result.data;
}

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<T, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: T, _metadata: ArgumentMetadata): T {
    try {
      return parseWithZod(this.schema, value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Request validation failed.",
          issues: error.issues,
        });
      }
      throw error;
    }
  }
}
