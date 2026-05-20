import { Router } from "express";
import { loginHandler, meHandler, registerHandler } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
const router = Router();
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", requireAuth, meHandler);
export default router;
