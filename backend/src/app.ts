import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import exerciseRoutes from "./routes/exercise.routes";
import workoutRoutes from "./routes/workout.routes";
import progressRoutes from "./routes/progress.routes";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.status(200).json({ status: "ok", service: "gym-tracker-api" }));

app.use("/auth", authRoutes);
app.use("/exercises", exerciseRoutes);
app.use("/workouts", workoutRoutes);
app.use("/progress", progressRoutes);
