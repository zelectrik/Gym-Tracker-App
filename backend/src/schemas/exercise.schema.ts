import { z } from "zod";

export const muscleGroups = [
  "CHEST",
  "UPPER_CHEST",
  "BACK",
  "LATS",
  "TRAPS",
  "SHOULDERS",
  "FRONT_SHOULDERS",
  "REAR_SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "ABS",
  "OBLIQUES",
  "LOWER_BACK",
  "QUADS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "ADDUCTORS",
  "ABDUCTORS",
  "CARDIO",
  "CORE",
  "FULL_BODY",
] as const;

export const muscleTags = [
  "pectoraux",
  "haut_pectoraux",
  "dos",
  "grand_dorsal",
  "trapezes",
  "epaules",
  "epaules_laterales",
  "avant_epaules",
  "arriere_epaules",
  "biceps",
  "triceps",
  "avant_bras",
  "abdominaux",
  "obliques",
  "lombaires",
  "bas_dos",
  "quadriceps",
  "ischios",
  "fessiers",
  "mollets",
  "adducteurs",
  "abducteurs",
  "jambes",
  "cardio",
  "core",
  "full_body",
] as const;

export const exerciseTypes = [
  "machine",
  "dumbbell",
  "barbell",
  "cable",
  "bodyweight",
  "cardio",
] as const;

export const progressionTypes = [
  "WEIGHT",
  "ASSISTED_WEIGHT",
  "DURATION",
] as const;

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1),
  muscleGroup: z.enum(muscleGroups),
  type: z.enum(exerciseTypes).default("machine"),
  progressionType: z.enum(progressionTypes).default("WEIGHT"),
  muscles: z.array(z.enum(muscleTags)).default([]),
  description: z.string().trim().optional(),
});


export const updateExerciseSchema = createExerciseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être modifié." },
);
