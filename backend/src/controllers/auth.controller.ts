import { Request, Response } from "express";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { login, register } from "../services/auth.service";

export const registerHandler = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  try {
    return res.status(201).json(await register(parsed.data));
  } catch (error) {
    if (error instanceof Error && error.cause === "USER_ALREADY_EXISTS")
      return res.status(409).json({ error: error.message });
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to register",
    });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  try {
    return res.status(200).json(await login(parsed.data));
  } catch (error) {
    if (error instanceof Error && error.cause === "INVALID_CREDENTIALS")
      return res.status(401).json({ error: error.message });
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to login",
    });
  }
};

export const meHandler = (req: Request, res: Response) =>
  res.status(200).json(req.user);
