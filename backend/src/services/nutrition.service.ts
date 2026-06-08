import { prisma } from "../lib/prisma";
import type { createNutritionEntrySchema } from "../schemas/nutrition.schema";
import type { z } from "zod";

type CreateNutritionEntryInput = z.infer<typeof createNutritionEntrySchema>;

function toDayDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function startOfDay(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDay(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

export const listNutritionEntries = async (
  userId: string,
  range?: { startDate?: string; endDate?: string },
) => {
  return prisma.nutritionEntry.findMany({
    where: {
      userId,
      ...(range?.startDate || range?.endDate
        ? {
            date: {
              ...(range.startDate ? { gte: startOfDay(range.startDate) } : {}),
              ...(range.endDate ? { lte: endOfDay(range.endDate) } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
};

export const createNutritionEntry = async (
  userId: string,
  data: CreateNutritionEntryInput,
) => {
  return prisma.nutritionEntry.create({
    data: {
      userId,
      date: toDayDate(data.date),
      mealType: data.mealType,
      description: data.description,
      calories: data.calories,
      proteinG: data.proteinG,
      carbsG: data.carbsG,
      fatG: data.fatG,
    },
  });
};

export const deleteNutritionEntry = async (userId: string, entryId: string) => {
  const result = await prisma.nutritionEntry.deleteMany({
    where: { id: entryId, userId },
  });

  return result.count > 0;
};
