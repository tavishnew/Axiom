import { auditLogsTable, db } from "@workspace/db";
import { logger } from "./logger";

export interface AuditEventInput {
  organizationId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an audit entry without allowing a logging failure to affect the caller's request.
 * Do not place secrets (passwords, session tokens, or raw API keys) in metadata.
 */
export function logAuditEvent(input: AuditEventInput): void {
  void db.insert(auditLogsTable).values({
    organizationId: input.organizationId,
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ?? {},
  }).catch((error) => {
    logger.error(
      {
        error,
        organizationId: input.organizationId,
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
      },
      "Failed to write audit event",
    );
  });
}
