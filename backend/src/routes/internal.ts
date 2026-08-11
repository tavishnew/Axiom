import { Router } from "express";
import { createCleanupHandler } from "../jobs/cleanup";

const router = Router();

router.post("/internal/cleanup", createCleanupHandler());

export default router;