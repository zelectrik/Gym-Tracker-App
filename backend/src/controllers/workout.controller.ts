import { Request, Response } from "express";
import {
  addSetSchema,
  createWorkoutSessionSchema,
  createWorkoutTemplateSchema,
  importProgramTemplateSchema,
  updateWorkoutStatusSchema,
} from "../schemas/workout.schema";
import {
  addSet,
  createSession,
  createTemplate,
  getSessionsForUser,
  getTemplates,
  importProgramTemplates,
  updateSessionStatus,
} from "../services/workout.service";

export const createTemplateHandler = async (req: Request, res: Response) => {
  const parsed = createWorkoutTemplateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(201).json(await createTemplate(req.user!.id, parsed.data));
};

export const importProgramTemplatesHandler = async (req: Request, res: Response) => {
  const parsed = importProgramTemplateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(201).json(await importProgramTemplates(req.user!.id, parsed.data));
};

export const getTemplatesHandler = async (req: Request, res: Response) =>
  res.status(200).json(await getTemplates(req.user!.id));

export const createSessionHandler = async (req: Request, res: Response) => {
  const parsed = createWorkoutSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(201).json(await createSession(req.user!.id, parsed.data));
};

export const getSessionsHandler = async (req: Request, res: Response) =>
  res.status(200).json(await getSessionsForUser(req.user!.id));

export const updateSessionStatusHandler = async (req: Request, res: Response) => {
  const parsed = updateWorkoutStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(200).json(await updateSessionStatus(req.params.sessionId as string, parsed.data.status));
};

export const addSetHandler = async (req: Request, res: Response) => {
  const parsed = addSetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(201).json(await addSet(req.params.sessionExerciseId as string, parsed.data));
};
