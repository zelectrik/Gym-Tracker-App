import { Request, Response } from "express";
import { createBodyGoalSchema, createBodySnapshotSchema } from "../schemas/body.schema";
import {
  deleteBodyGoal,
  listBodyGoals,
  listBodySnapshots,
  upsertBodyGoal,
  upsertBodySnapshot,
} from "../services/body.service";

function isBodyGoalDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("bodygoal") ||
    message.includes("bodymetric") ||
    message.includes("bodygoaltype") ||
    message.includes("the table") ||
    message.includes("does not exist") ||
    message.includes("p2021") ||
    message.includes("p2022")
  );
}

function bodyGoalDatabaseErrorResponse(res: Response) {
  return res.status(503).json({
    error:
      "Les objectifs physiques ne sont pas encore disponibles. Lance la migration Prisma add_body_goals puis redémarre le backend.",
  });
}

export const getBodySnapshotsHandler = async (req: Request, res: Response) => {
  const snapshots = await listBodySnapshots(req.user!.id);
  return res.status(200).json(snapshots);
};

export const createBodySnapshotHandler = async (req: Request, res: Response) => {
  const parsed = createBodySnapshotSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const snapshot = await upsertBodySnapshot(req.user!.id, parsed.data);
  return res.status(201).json(snapshot);
};

export const getBodyGoalsHandler = async (req: Request, res: Response) => {
  try {
    const goals = await listBodyGoals(req.user!.id);
    return res.status(200).json(goals);
  } catch (error) {
    if (isBodyGoalDatabaseError(error)) return bodyGoalDatabaseErrorResponse(res);
    throw error;
  }
};

export const createBodyGoalHandler = async (req: Request, res: Response) => {
  const parsed = createBodyGoalSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const goal = await upsertBodyGoal(req.user!.id, parsed.data);
    return res.status(201).json(goal);
  } catch (error) {
    if (isBodyGoalDatabaseError(error)) return bodyGoalDatabaseErrorResponse(res);
    throw error;
  }
};

export const deleteBodyGoalHandler = async (req: Request, res: Response) => {
  try {
    const deleted = await deleteBodyGoal(req.user!.id, String(req.params.goalId));

    if (!deleted) {
      return res.status(404).json({ error: "Objectif introuvable" });
    }

    return res.status(204).send();
  } catch (error) {
    if (isBodyGoalDatabaseError(error)) return bodyGoalDatabaseErrorResponse(res);
    throw error;
  }
};
