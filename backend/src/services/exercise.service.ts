import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

type CreateExerciseInput = {
  name: string;
  muscleGroup: any;
  description?: string;
};

const defaultExercises: CreateExerciseInput[] = [
  { name: "développé couché", muscleGroup: "CHEST", description: "Exercice de base pour les pectoraux." },
  { name: "développé incliné haltères", muscleGroup: "CHEST" },
  { name: "tirage vertical", muscleGroup: "BACK" },
  { name: "rowing assis", muscleGroup: "BACK" },
  { name: "développé épaules", muscleGroup: "SHOULDERS" },
  { name: "élévations latérales", muscleGroup: "SHOULDERS" },
  { name: "curl biceps", muscleGroup: "BICEPS" },
  { name: "extension triceps poulie", muscleGroup: "TRICEPS" },
  { name: "presse à cuisses", muscleGroup: "LEGS" },
  { name: "leg extension", muscleGroup: "LEGS" },
  { name: "leg curl", muscleGroup: "LEGS" },
  { name: "fente bulgare", muscleGroup: "LEGS", description: "Pratique en unilatéral gauche/droite." },
  { name: "hip thrust", muscleGroup: "GLUTES" },
  { name: "gainage", muscleGroup: "ABS" },
  { name: "vélo", muscleGroup: "CARDIO" },
];

export const seedDefaultExercises = async () => {
  await prisma.exercise.createMany({
    data: defaultExercises.map((exercise) => ({
      ...exercise,
      name: exercise.name.trim().toLowerCase(),
    })),
    skipDuplicates: true,
  });
};

export const createExercise = async (data: CreateExerciseInput) => {
  try {
    return await prisma.exercise.create({
      data: {
        name: data.name.trim().toLowerCase(),
        muscleGroup: data.muscleGroup,
        description: data.description,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Exercise already exists", { cause: "EXERCISE_ALREADY_EXISTS" });
    }

    throw error;
  }
};

export const getExercises = async () => {
  const count = await prisma.exercise.count();
  if (count === 0) await seedDefaultExercises();

  return prisma.exercise.findMany({
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });
};
