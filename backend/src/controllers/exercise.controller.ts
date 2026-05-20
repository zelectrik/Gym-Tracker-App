import { Request, Response } from "express";
import { createExerciseSchema } from "../schemas/exercise.schema";
import { createExercise, getExercises } from "../services/exercise.service";

export const createExerciseHandler = async (req: Request, res: Response) => {
  const parsed = createExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    return res.status(201).json(await createExercise(parsed.data));
  } catch (error) {
    if (error instanceof Error && error.cause === "EXERCISE_ALREADY_EXISTS") return res.status(409).json({ error: error.message });
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create exercise" });
  }
};
export const getExercisesHandler = async (_req: Request, res: Response) => res.status(200).json(await getExercises());
