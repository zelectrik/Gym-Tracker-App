import { Router } from "express";
import {
  addSessionExerciseHandler,
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
  replaceSessionExerciseHandler,
  removeSessionExerciseHandler,
  getSessionExerciseSuggestionsHandler,
} from "../controllers/workout.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  clearWorkoutScheduleHandler,
  getWorkoutScheduleHandler,
  upsertWorkoutScheduleHandler,
} from "../controllers/workoutSchedule.controller";

const router = Router();

router.use(requireAuth);
router.get("/templates", getTemplatesHandler);
router.post("/templates", createTemplateHandler);
router.patch("/templates/:templateId", updateTemplateHandler);
router.delete("/templates/:templateId", deleteTemplateHandler);
router.post("/templates/import-json", importProgramTemplatesHandler);
router.get("/schedule", getWorkoutScheduleHandler);
router.put("/schedule", upsertWorkoutScheduleHandler);
router.delete("/schedule", clearWorkoutScheduleHandler);
router.get("/exercises/:exerciseId/last-performance", getLastExercisePerformanceHandler);
router.get("/sessions", getSessionsHandler);
router.post("/sessions", createSessionHandler);
router.patch("/sessions/:sessionId/status", updateSessionStatusHandler);
router.delete("/sessions/:sessionId", deleteSessionHandler);
router.post("/sessions/:sessionId/exercises", addSessionExerciseHandler);
router.get("/session-exercises/:sessionExerciseId/suggestions", getSessionExerciseSuggestionsHandler);
router.patch("/session-exercises/:sessionExerciseId/replace", replaceSessionExerciseHandler);
router.delete("/session-exercises/:sessionExerciseId", removeSessionExerciseHandler);
router.post("/session-exercises/:sessionExerciseId/sets", addSetHandler);
router.put("/session-exercises/:sessionExerciseId/cardio-entry", upsertCardioEntryHandler);

export default router;
