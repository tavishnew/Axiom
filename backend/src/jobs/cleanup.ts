import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const DEFAULT_LOG_RETENTION_DAYS = 7;

function getLogRetentionDays(): number {
  const val = process.env.LOG_RETENTION_DAYS;
  if (!val) return DEFAULT_LOG_RETENTION_DAYS;
  const parsed = Number(val);
  if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_LOG_RETENTION_DAYS;
  return parsed;
}

export async function cleanupDecisionLogs(): Promise<number> {
  const days = getLogRetentionDays();
  const result = await pool.query(
    `DELETE FROM decision_logs WHERE created_at < NOW() - INTERVAL '${days} days';`
  );
  const count = result.rowCount ?? 0;
  if (count > 0) {
    logger.info({ deleted: count, retentionDays: days }, "Cleaned up stale decision logs");
  }
  return count;
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await pool.query("DELETE FROM session WHERE expires_at < NOW();");
  const count = result.rowCount ?? 0;
  if (count > 0) {
    logger.info({ deleted: count }, "Cleaned up expired sessions");
  }
  return count;
}

export async function runCleanup(): Promise<void> {
  logger.info("Starting scheduled database cleanup");
  const [logsDeleted, sessionsDeleted] = await Promise.all([
    cleanupDecisionLogs(),
    cleanupExpiredSessions(),
  ]);
  logger.info({ logsDeleted, sessionsDeleted }, "Scheduled database cleanup complete");
}

const INTERNAL_CLEANUP_SECRET = process.env.INTERNAL_CLEANUP_SECRET;

export function createCleanupHandler() {
  return async (req: Request, res: Response) => {
    if (!INTERNAL_CLEANUP_SECRET) {
      logger.warn("INTERNAL_CLEANUP_SECRET not set, cleanup endpoint disabled");
      return res.status(503).json({ error: "Cleanup not configured" });
    }

    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${INTERNAL_CLEANUP_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const [logsDeleted, sessionsDeleted] = await Promise.all([
        cleanupDecisionLogs(),
        cleanupExpiredSessions(),
      ]);
      return res.json({ success: true, logsDeleted, sessionsDeleted });
    } catch (err) {
      logger.error({ err }, "Cleanup endpoint error");
      return res.status(500).json({ error: "Internal error" });
    }
  };
}

function startCron(): void {
  const intervalMs = 24 * 60 * 60 * 1000;
  logger.info({ intervalMs }, "Starting cleanup cron job");
  setInterval(() => {
    runCleanup().catch((err) => logger.error({ err }, "Cleanup cron error"));
  }, intervalMs);
  runCleanup().catch((err) => logger.error({ err }, "Initial cleanup error"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startCron();
}

export { startCron };