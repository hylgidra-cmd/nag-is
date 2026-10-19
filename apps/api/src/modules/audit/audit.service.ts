import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AuditEntry {
  actorId: string | null;
  /** Dotted action name, e.g. "course.publish", "user.role_change". */
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

/**
 * Append-only audit trail for administrative actions.
 *
 * Writing the trail must never be the reason a legitimate action fails, so
 * failures are logged and swallowed rather than propagated. The trail is a
 * record of what happened, not a precondition for it happening.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for ${entry.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
