import { Router, type IRouter, type Request, type Response } from "express";
import { Registry, collectDefaultMetrics } from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

const router: IRouter = Router();

let requestCount = 0;
let totalResponseTime = 0;
let errorCount = 0;

router.use((req, res, next) => {
  const start = Date.now();
  requestCount++;

  res.on("finish", () => {
    const duration = Date.now() - start;
    totalResponseTime += duration;
    if (res.statusCode >= 400) errorCount++;
  });

  next();
});

router.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

router.get("/metrics/summary", (_req: Request, res: Response) => {
  const avgResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;
  res.json({
    requestCount,
    errorCount,
    errorRate: requestCount > 0 ? errorCount / requestCount : 0,
    avgResponseTimeMs: Math.round(avgResponseTime),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

export default router;