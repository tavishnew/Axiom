import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { HealthCheckResponse, DetailedHealthCheckResponse } from "@workspace/api-zod";
import { getEnv } from "../lib/env";

const router: IRouter = Router();

router.get("/healthz", async (_req: Request, res: Response) => {
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 2000)),
    ]);
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch {
    res.status(503).json({ status: "error" });
  }
});

router.get("/healthz/detailed", async (_req: Request, res: Response) => {
  const env = getEnv();
  const start = Date.now();
  let dbStatus = "ok";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 2000)),
    ]);
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
    dbLatency = Date.now() - start;
  }

  const uptime = process.uptime();
  const memory = process.memoryUsage();

  const data = DetailedHealthCheckResponse.parse({
    status: dbStatus === "ok" ? "ok" : "degraded",
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024),
      },
      uptime: Math.round(uptime),
      version: process.env.npm_package_version || "0.0.0",
      environment: env.NODE_ENV,
    },
  });

  const statusCode = data.status === "ok" ? 200 : 503;
  res.status(statusCode).json(data);
});

export default router;
