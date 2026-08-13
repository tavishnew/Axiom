import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { validateEnv } from "./lib/env";

validateEnv();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Allow Vercel preview deployments through while production remains on the exact FRONTEND_URL list.
const vercelPreviewPattern = /^https:\/\/axiom-[a-z0-9]+-tavish0554-9516s-projects\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
// Stripe validates the exact, unparsed payload. Register this exception before the JSON parser.
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api", router);

// Keep the API contract JSON-only, including unmatched API routes.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: { message: "API route not found" } });
});

const apiErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = typeof error?.status === "number" && error.status >= 400 && error.status < 600
    ? error.status
    : error instanceof SyntaxError && "body" in error
      ? 400
      : 500;
  const message = status === 400 ? "Invalid JSON request body" : "Internal server error";

  logger.error({ err: error, method: req.method, path: req.path, status }, "Unhandled API error");
  return res.status(status).json({ error: { message } });
};

app.use(apiErrorHandler);

export default app;
