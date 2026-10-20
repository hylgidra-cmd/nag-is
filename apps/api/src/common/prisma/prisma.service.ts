import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';

/**
 * Prisma access layer.
 *
 * Prisma 7 connects through a driver adapter rather than reading the URL out
 * of schema.prisma, so the node-postgres pool is constructed here. The pool
 * settings matter: without a cap, a burst of requests can open more
 * connections than PostgreSQL's `max_connections` allows and the whole API
 * starts failing at the database rather than queueing.
 *
 * The pool is built explicitly rather than handing a config object to
 * `PrismaPg`, for two reasons:
 *
 *  * `attachDatabasePool` needs the pool instance itself (see below).
 *  * `PrismaPg` treats a pool it did not create as external and will not
 *    close it on `$disconnect()`, so `onModuleDestroy` ends it here.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. The API cannot start without a database connection.',
      );
    }

    /*
     * On a serverless platform the API runs as many short-lived instances
     * rather than one long-lived process, so each instance must hold far
     * fewer connections than a single server would: the ceiling is
     * instances x max, not max. A low per-instance cap plus a connection
     * pooler in front of PostgreSQL is what keeps that product under
     * `max_connections`. Override with DATABASE_POOL_MAX.
     */
    const isServerless = Boolean(process.env['VERCEL']);
    const poolMax = Number(process.env['DATABASE_POOL_MAX'] ?? (isServerless ? 3 : 10));

    const pool = new Pool({
      connectionString,
      max: poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    /*
     * Fluid compute suspends an instance between requests. Without this, the
     * instance can be frozen before node-postgres has retired its idle
     * connections, leaving them held open on the database until it times them
     * out. This keeps the instance alive just long enough to drain them. It is
     * a no-op off-platform, so local development is unaffected.
     */
    attachDatabasePool(pool);

    super({
      adapter: new PrismaPg(pool),
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.pool = pool;
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
    // The pool is external to Prisma, so closing the client does not close it.
    await this.pool.end();
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
