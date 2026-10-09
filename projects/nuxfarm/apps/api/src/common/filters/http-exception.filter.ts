import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ZodError } from "zod";

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred.";
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionBody = exception.getResponse();
      if (typeof exceptionBody === "string") {
        message = exceptionBody;
      } else if (typeof exceptionBody === "object" && exceptionBody !== null) {
        const body = exceptionBody as Record<string, unknown>;
        message =
          typeof body.message === "string"
            ? body.message
            : exception.message || message;
        if (Array.isArray(body.issues)) {
          details = body.issues;
        } else if (body.message !== undefined) {
          details = body.message;
        }
      }
      code = status === HttpStatus.UNAUTHORIZED ? "UNAUTHORIZED" : "HTTP_ERROR";
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = "VALIDATION_ERROR";
      message = "Request validation failed.";
      details = exception.issues;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    } satisfies ApiErrorResponse);

    // Keep a server-side trace for diagnostics without leaking it.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(`[${request.method}] ${request.url}`, exception);
    }
  }
}
