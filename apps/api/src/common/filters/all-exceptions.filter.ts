import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { ApiErrorBody } from '@nagis/shared-types';
import { AppError, ErrorCode } from '../errors/app.error';

/**
 * Turns every thrown value into one consistent JSON envelope.
 *
 * Unexpected errors are logged with their stack but reported to the client as
 * a bare INTERNAL code: a stack trace or a Prisma message can disclose table
 * names and query shapes, so it never crosses the wire.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = this.resolve(exception);

    const body: ApiErrorBody = {
      statusCode: resolved.status,
      code: resolved.code,
      message: resolved.message,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    };
    if (resolved.fields) body.fields = resolved.fields;

    const requestId = request.headers['x-request-id'];
    if (typeof requestId === 'string') body.requestId = requestId;

    if (resolved.status >= 500) {
      this.logger.error(
        `${request.method} ${body.path} -> ${resolved.status} ${resolved.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (resolved.status === 429) {
      this.logger.warn(`${request.method} ${body.path} -> rate limited`);
    }

    response.status(resolved.status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  } {
    if (exception instanceof AppError) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        ...(exception.fields ? { fields: exception.fields } : {}),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      // Nest's own exceptions (and the throttler) report a plain shape.
      if (typeof payload === 'object' && payload !== null) {
        const record = payload as Record<string, unknown>;
        const code =
          typeof record['code'] === 'string'
            ? record['code']
            : this.statusToCode(status);
        const message =
          typeof record['message'] === 'string'
            ? record['message']
            : Array.isArray(record['message'])
              ? record['message'].join('; ')
              : exception.message;
        const fields =
          typeof record['fields'] === 'object' && record['fields'] !== null
            ? (record['fields'] as Record<string, string[]>)
            : undefined;
        return { status, code, message, ...(fields ? { fields } : {}) };
      }

      return { status, code: this.statusToCode(status), message: exception.message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrisma(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL,
      message: 'Internal server error',
    };
  }

  private resolvePrisma(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    code: string;
    message: string;
  } {
    switch (error.code) {
      // Unique constraint violation.
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT',
          message: 'A record with these values already exists',
        };
      // Foreign key constraint failed.
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Referenced record does not exist',
        };
      // Required relation violation / delete restricted.
      case 'P2014':
      case 'P2017':
        return {
          status: HttpStatus.CONFLICT,
          code: 'RELATION_CONSTRAINT',
          message: 'This record is referenced by other records',
        };
      // Record not found.
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Record not found',
        };
      default:
        this.logger.error(`Unhandled Prisma error ${error.code}`, error.stack);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCode.INTERNAL,
          message: 'Internal server error',
        };
    }
  }

  /**
   * Default machine code for a Nest exception that carries no code of its own.
   *
   * A plain `number` keyed map rather than a switch over HttpStatus: the
   * status arrives as a number from `exception.getStatus()`, and comparing a
   * number against enum members is exactly what
   * `no-unsafe-enum-comparison` flags.
   */
  private statusToCode(status: number): string {
    const BY_STATUS: Record<number, string> = {
      400: ErrorCode.VALIDATION_FAILED,
      401: ErrorCode.UNAUTHORIZED,
      402: ErrorCode.PAYMENT_REQUIRED,
      403: ErrorCode.FORBIDDEN,
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: ErrorCode.RATE_LIMITED,
    };
    return BY_STATUS[status] ?? ErrorCode.INTERNAL;
  }
}
