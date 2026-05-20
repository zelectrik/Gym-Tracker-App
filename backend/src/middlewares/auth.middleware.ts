import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { getUserById, verifyAuthToken } from "../services/auth.service";

export type AuthenticatedUser = { id: string; email: string; role: UserRole; displayName: string };

declare global { namespace Express { interface Request { user?: AuthenticatedUser } } }

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing authentication token" });
  try {
    const payload = verifyAuthToken(authorization.replace("Bearer ", ""));
    const user = await getUserById(payload.userId);
    if (!user) return res.status(401).json({ error: "Invalid authentication token" });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid authentication token" });
  }
};
