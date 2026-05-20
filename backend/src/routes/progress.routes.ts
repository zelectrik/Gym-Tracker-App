import { Router } from "express";
import { getProgressHandler } from "../controllers/progress.controller";
import { requireAuth } from "../middlewares/auth.middleware";
const router = Router();
router.use(requireAuth);
router.get("/", getProgressHandler);
export default router;
