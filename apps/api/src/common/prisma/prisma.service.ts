import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma access layer.
 *
 * Prisma 7 connects through a driver adapter rather than reading the URL out
 * of schema.prisma, so the node-postgres pool is constructed here. The pool
 * settings matter: without a cap, a burst of requests can open more
 * connections than PostgreSQL's `max_connections` allows and the whole API
 * starts failing at the database rather than queueing.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. The API cannot start without a database connection.',
      );
    }

    const adapter = new PrismaPg({
      connectionString,
      max: Number(process.env['DATABASE_POOL_MAX'] ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    // Route Prisma's own diagnostics into the Nest logger so they land in the
    // same structured stream as everything else.
    this.$on('warn' as never, (event: unknown) => {
      this.logger.warn(this.describeEvent(event));
    });
    this.$on('error' as never, (event: unknown) => {
      this.logger.error(this.describeEvent(event));
    });

    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private describeEvent(event: unknown): string {
    if (typeof event === 'object' && event !== null && 'message' in event) {
      const { message } = event;
      if (typeof message === 'string') return message;
    }
    return String(event);
  }

  /** Liveness probe used by the health endpoint. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.warn(
        `Database health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
