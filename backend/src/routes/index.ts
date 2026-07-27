import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accessforgeRouter from "./accessforge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accessforgeRouter);

export default router;
