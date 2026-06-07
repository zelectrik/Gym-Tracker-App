import { Router } from "express";
import {
  createBodySnapshotHandler,
  getBodySnapshotsHandler,
} from "../controllers/body.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/snapshots", getBodySnapshotsHandler);
router.post("/snapshots", createBodySnapshotHandler);

export default router;
