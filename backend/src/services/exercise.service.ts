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

type UpdateExerciseInput = Partial<CreateExerciseInput>;

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function mapExerciseData(data: UpdateExerciseInput) {
  return {
    ...(data.name !== undefined ? { name: normalizeName(data.name) } : {}),
    ...(data.muscleGroup !== undefined ? { muscleGroup: data.muscleGroup } : {}),
    ...(data.type !== undefined ? { type: data.type } : {}),
    ...(data.progressionType !== undefined ? { progressionType: data.progressionType } : {}),
    ...(data.muscles !== undefined ? { muscles: data.muscles } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
  };
}

function handleExerciseUniqueError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error("Exercise already exists", {
      cause: "EXERCISE_ALREADY_EXISTS",
    });
  }
}

export const createExercise = async (data: CreateExerciseInput) => {
  try {
    return await prisma.exercise.create({
      data: {
        name: normalizeName(data.name),
        muscleGroup: data.muscleGroup,
        type: data.type ?? "machine",
        progressionType: data.progressionType ?? "WEIGHT",
        muscles: data.muscles ?? [],
        description: data.description,
      },
    });
  } catch (error) {
    handleExerciseUniqueError(error);
    throw error;
  }
};

export const updateExercise = async (exerciseId: string, data: UpdateExerciseInput) => {
  try {
    return await prisma.exercise.update({
      where: { id: exerciseId },
      data: mapExerciseData(data),
    });
  } catch (error) {
    handleExerciseUniqueError(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Exercise not found", { cause: "EXERCISE_NOT_FOUND" });
    }

    throw error;
  }
};

export const deleteExercise = async (exerciseId: string) => {
  const [templateUsage, sessionUsage] = await Promise.all([
    prisma.templateExercise.count({ where: { exerciseId } }),
    prisma.sessionExercise.count({ where: { exerciseId } }),
  ]);

  if (templateUsage > 0 || sessionUsage > 0) {
    throw new Error(
      `Impossible de supprimer cet exercice : utilisé dans ${templateUsage} programme(s) et ${sessionUsage} séance(s).`,
      { cause: "EXERCISE_IN_USE" },
    );
  }

  try {
    await prisma.exercise.delete({ where: { id: exerciseId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Exercise not found", { cause: "EXERCISE_NOT_FOUND" });
    }

    throw error;
  }
};

export const getExercises = async () => {
  return prisma.exercise.findMany({
    orderBy: [{ name: "asc" }],
  });
};
