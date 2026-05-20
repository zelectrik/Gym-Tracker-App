import { Request, Response } from "express";
import { getUserProgress } from "../services/progress.service";

export const getProgressHandler = async (req: Request, res: Response) => res.status(200).json(await getUserProgress(req.user!.id));
