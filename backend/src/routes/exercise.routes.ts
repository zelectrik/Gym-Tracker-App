import { Router } from "express";
import {
  createExerciseHandler,
  deleteExerciseHandler,
  getExercisesHandler,
  updateExerciseHandler,
} from "../controllers/exercise.controller";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);
router.get("/", getExercisesHandler);
router.post("/", requireSuperAdmin, createExerciseHandler);
router.patch("/:exerciseId", requireSuperAdmin, updateExerciseHandler);
router.delete("/:exerciseId", requireSuperAdmin, deleteExerciseHandler);

export default router;
