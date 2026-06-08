import { Request, Response } from "express";
import { upsertWorkoutScheduleSchema } from "../schemas/workoutSchedule.schema";
import {
  clearWorkoutSchedule,
  getWorkoutSchedule,
  upsertWorkoutSchedule,
} from "../services/workoutSchedule.service";

export const getWorkoutScheduleHandler = async (req: Request, res: Response) => {
  return res.status(200).json(await getWorkoutSchedule(req.user!.id));
};

export const upsertWorkoutScheduleHandler = async (req: Request, res: Response) => {
  const parsed = upsertWorkoutScheduleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(200).json(await upsertWorkoutSchedule(req.user!.id, parsed.data));
};

export const clearWorkoutScheduleHandler = async (req: Request, res: Response) => {
  await clearWorkoutSchedule(req.user!.id);
  return res.status(204).send();
};
