import { Request, Response } from "express";
import {
  addSessionExerciseSchema,
  addSetSchema,
  cardioEntrySchema,
  createWorkoutSessionSchema,
  createWorkoutTemplateSchema,
  importProgramTemplateSchema,
  updateWorkoutStatusSchema,
  replaceSessionExerciseSchema,
} from "../schemas/workout.schema";
import {
  addSessionExercise,
  addSet,
  upsertCardioEntry,
  createSession,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  deleteSession,
  getLastExercisePerformance,
  getSessionsForUser,
  getTemplates,
  importProgramTemplates,
  updateSessionStatus,
  replaceSessionExercise,
  removeSessionExercise,
  getSessionExerciseSuggestions,
} from "../services/workout.service";

export const updateTemplateHandler = async (req: Request, res: Response) => {
  const parsed = createWorkoutTemplateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(200).json(await updateTemplate(req.user!.id, req.params.templateId as string, parsed.data));
};

export const deleteTemplateHandler = async (req: Request, res: Response) => {
  await deleteTemplate(req.user!.id, req.params.templateId as string);
  return res.status(204).send();
};

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
  return res.status(200).json(
    await updateSessionStatus(
      req.user!.id,
      req.params.sessionId as string,
      parsed.data.status,
    ),
  );
};

export const deleteSessionHandler = async (req: Request, res: Response) => {
  await deleteSession(req.user!.id, req.params.sessionId as string);
  return res.status(204).send();
};

export const addSetHandler = async (req: Request, res: Response) => {
  const parsed = addSetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(201).json(await addSet(req.params.sessionExerciseId as string, parsed.data));
};

export const upsertCardioEntryHandler = async (req: Request, res: Response) => {
  const parsed = cardioEntrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(200).json(
    await upsertCardioEntry(req.params.sessionExerciseId as string, parsed.data),
  );
};


export const getLastExercisePerformanceHandler = async (req: Request, res: Response) => {
  const result = await getLastExercisePerformance(
    req.user!.id,
    req.params.exerciseId as string,
  );

  return res.status(200).json(result);
};

export const addSessionExerciseHandler = async (req: Request, res: Response) => {
  const parsed = addSessionExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(201).json(
    await addSessionExercise(req.user!.id, req.params.sessionId as string, parsed.data),
  );
};

export const replaceSessionExerciseHandler = async (req: Request, res: Response) => {
  const parsed = replaceSessionExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(200).json(
    await replaceSessionExercise(req.user!.id, req.params.sessionExerciseId as string, parsed.data.exerciseId),
  );
};

export const removeSessionExerciseHandler = async (req: Request, res: Response) => {
  await removeSessionExercise(req.user!.id, req.params.sessionExerciseId as string);
  return res.status(204).send();
};

export const getSessionExerciseSuggestionsHandler = async (req: Request, res: Response) => {
  return res.status(200).json(
    await getSessionExerciseSuggestions(req.user!.id, req.params.sessionExerciseId as string),
  );
};
