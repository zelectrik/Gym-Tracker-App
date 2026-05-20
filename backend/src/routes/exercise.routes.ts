import { Router } from "express";
import { createExerciseHandler, getExercisesHandler } from "../controllers/exercise.controller";
import { requireAuth } from "../middlewares/auth.middleware";
const router = Router();
router.use(requireAuth);
router.get("/", getExercisesHandler);
router.post("/", createExerciseHandler);
export default router;
