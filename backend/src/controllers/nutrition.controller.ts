import { Request, Response } from "express";
import { createNutritionEntrySchema, nutritionRangeSchema } from "../schemas/nutrition.schema";
import {
  createNutritionEntry,
  deleteNutritionEntry,
  listNutritionEntries,
} from "../services/nutrition.service";

function isNutritionDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("nutritionentry") ||
    message.includes("mealtype") ||
    message.includes("the table") ||
    message.includes("does not exist") ||
    message.includes("p2021") ||
    message.includes("p2022")
  );
}

function nutritionDatabaseErrorResponse(res: Response) {
  return res.status(503).json({
    error:
      "La nutrition n'est pas encore disponible. Lance la migration Prisma add_nutrition_entries puis redémarre le backend.",
  });
}

export const getNutritionEntriesHandler = async (req: Request, res: Response) => {
  const parsed = nutritionRangeSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const entries = await listNutritionEntries(req.user!.id, parsed.data);
    return res.status(200).json(entries);
  } catch (error) {
    if (isNutritionDatabaseError(error)) return nutritionDatabaseErrorResponse(res);
    throw error;
  }
};

export const createNutritionEntryHandler = async (req: Request, res: Response) => {
  const parsed = createNutritionEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const entry = await createNutritionEntry(req.user!.id, parsed.data);
    return res.status(201).json(entry);
  } catch (error) {
    if (isNutritionDatabaseError(error)) return nutritionDatabaseErrorResponse(res);
    throw error;
  }
};

export const deleteNutritionEntryHandler = async (req: Request, res: Response) => {
  try {
    const deleted = await deleteNutritionEntry(req.user!.id, String(req.params.entryId));

    if (!deleted) {
      return res.status(404).json({ error: "Entrée nutrition introuvable" });
    }

    return res.status(204).send();
  } catch (error) {
    if (isNutritionDatabaseError(error)) return nutritionDatabaseErrorResponse(res);
    throw error;
  }
};
