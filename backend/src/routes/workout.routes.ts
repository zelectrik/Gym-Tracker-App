import { Router } from "express";
import {
  addSetHandler,
  upsertCardioEntryHandler,
  createSessionHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  deleteSessionHandler,
  getLastExercisePerformanceHandler,
  getSessionsHandler,
  getTemplatesHandler,
  importProgramTemplatesHandler,
  updateSessionStatusHandler,
} from "../controllers/workout.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/templates", getTemplatesHandler);
router.post("/templates", createTemplateHandler);
router.patch("/templates/:templateId", updateTemplateHandler);
router.delete("/templates/:templateId", deleteTemplateHandler);
router.post("/templates/import-json", importProgramTemplatesHandler);
router.get("/exercises/:exerciseId/last-performance", getLastExercisePerformanceHandler);
router.get("/sessions", getSessionsHandler);
router.post("/sessions", createSessionHandler);
router.patch("/sessions/:sessionId/status", updateSessionStatusHandler);
router.delete("/sessions/:sessionId", deleteSessionHandler);
router.post("/session-exercises/:sessionExerciseId/sets", addSetHandler);
router.put("/session-exercises/:sessionExerciseId/cardio-entry", upsertCardioEntryHandler);

export default router;
