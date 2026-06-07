import { Request, Response } from "express";
import { createBodySnapshotSchema } from "../schemas/body.schema";
import { listBodySnapshots, upsertBodySnapshot } from "../services/body.service";

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
