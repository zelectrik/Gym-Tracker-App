import { Request, Response } from "express";
import { createExerciseSchema, updateExerciseSchema } from "../schemas/exercise.schema";
import {
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
} from "../services/exercise.service";

function handleExerciseError(error: unknown, res: Response) {
  if (error instanceof Error && error.cause === "EXERCISE_ALREADY_EXISTS") {
    return res.status(409).json({ error: error.message });
  }

  if (error instanceof Error && error.cause === "EXERCISE_NOT_FOUND") {
    return res.status(404).json({ error: "Exercice introuvable" });
  }

  if (error instanceof Error && error.cause === "EXERCISE_IN_USE") {
    return res.status(409).json({ error: error.message });
  }

  return res.status(500).json({
    error: error instanceof Error ? error.message : "Failed to handle exercise",
  });
}

export const createExerciseHandler = async (req: Request, res: Response) => {
  const parsed = createExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    return res.status(201).json(await createExercise(parsed.data));
  } catch (error) {
    return handleExerciseError(error, res);
  }
};

export const updateExerciseHandler = async (req: Request, res: Response) => {
  const parsed = updateExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    return res.status(200).json(await updateExercise(String(req.params.exerciseId), parsed.data));
  } catch (error) {
    return handleExerciseError(error, res);
  }
};

export const deleteExerciseHandler = async (req: Request, res: Response) => {
  try {
    await deleteExercise(String(req.params.exerciseId));
    return res.status(204).send();
  } catch (error) {
    return handleExerciseError(error, res);
  }
};

export const getExercisesHandler = async (_req: Request, res: Response) =>
  res.status(200).json(await getExercises());
