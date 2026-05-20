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

export const muscleTags = [
  "pectoraux",
  "haut_pectoraux",
  "dos",
  "grand_dorsal",
  "trapèzes",
  "épaules",
  "avant_epaules",
  "arriere_epaules",
  "biceps",
  "triceps",
  "avant_bras",
  "abdominaux",
  "obliques",
  "lombaires",
  "quadriceps",
  "ischios",
  "fessiers",
  "mollets",
  "adducteurs",
  "abducteurs",
  "cardio",
  "core",
  "full_body",
] as const;

export const exerciseTypes = ["machine", "dumbbell", "barbell", "cable", "bodyweight", "cardio"] as const;

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1),
  muscleGroup: z.enum(muscleGroups),
  type: z.enum(exerciseTypes).default("machine"),
  muscles: z.array(z.enum(muscleTags)).default([]),
  description: z.string().trim().optional(),
});
