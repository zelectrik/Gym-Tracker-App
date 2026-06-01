import { Prisma, ProgressionType } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type MuscleTag =
  | "pectoraux"
  | "haut_pectoraux"
  | "dos"
  | "grand_dorsal"
  | "trapezes"
  | "epaules"
  | "epaules_laterales"
  | "avant_epaules"
  | "arriere_epaules"
  | "biceps"
  | "triceps"
  | "avant_bras"
  | "abdominaux"
  | "obliques"
  | "lombaires"
  | "bas_dos"
  | "quadriceps"
  | "ischios"
  | "fessiers"
  | "mollets"
  | "adducteurs"
  | "abducteurs"
  | "jambes"
  | "cardio"
  | "core"
  | "full_body";

type CreateExerciseInput = {
  name: string;
  muscleGroup: any;
  type?: string;
  progressionType?: ProgressionType;
  muscles?: MuscleTag[];
  description?: string;
};

export const createExercise = async (data: CreateExerciseInput) => {
  try {
    return await prisma.exercise.create({
      data: {
        name: data.name.trim().toLowerCase(),
        muscleGroup: data.muscleGroup,
        type: data.type ?? "machine",
        progressionType: data.progressionType ?? "WEIGHT",
        muscles: data.muscles ?? [],
        description: data.description,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Exercise already exists", {
        cause: "EXERCISE_ALREADY_EXISTS",
      });
    }

    throw error;
  }
};

export const getExercises = async () => {
  return prisma.exercise.findMany({
    orderBy: [{ name: "asc" }],
  });
};
