import { Router } from "express";
import {
  createNutritionEntryHandler,
  deleteNutritionEntryHandler,
  getNutritionEntriesHandler,
} from "../controllers/nutrition.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/entries", getNutritionEntriesHandler);
router.post("/entries", createNutritionEntryHandler);
router.delete("/entries/:entryId", deleteNutritionEntryHandler);

export default router;
