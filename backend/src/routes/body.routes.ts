import { Router } from "express";
import {
  createBodyGoalHandler,
  createBodySnapshotHandler,
  deleteBodyGoalHandler,
  getBodyGoalsHandler,
  getBodySnapshotsHandler,
} from "../controllers/body.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/snapshots", getBodySnapshotsHandler);
router.post("/snapshots", createBodySnapshotHandler);
router.get("/goals", getBodyGoalsHandler);
router.post("/goals", createBodyGoalHandler);
router.delete("/goals/:goalId", deleteBodyGoalHandler);

export default router;
