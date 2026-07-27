import { Router, type IRouter } from "express";
import healthRouter from "./health";
import axiomRouter from "./axiom";

const router: IRouter = Router();

router.use(healthRouter);
router.use(axiomRouter);

export default router;
