import { Router, type IRouter } from "express";
import healthRouter from "./health";
import axiomRouter from "./axiom";
import metricsRouter from "./metrics";
import invitationsRouter from "./invitations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(axiomRouter);
router.use(metricsRouter);
router.use(invitationsRouter);

export default router;
