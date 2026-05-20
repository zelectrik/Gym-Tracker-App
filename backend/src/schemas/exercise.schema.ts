import { z } from "zod";

export const muscleGroups = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTES",
  "ABS",
  "CARDIO",
  "FULL_BODY",
  "OTHER",
] as const;

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1),
  muscleGroup: z.enum(muscleGroups),
  description: z.string().trim().optional(),
});
