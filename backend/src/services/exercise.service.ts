import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const createExercise = async (data: { name: string; muscleGroup: any; description?: string }) => {
  try {
    return await prisma.exercise.create({ data: { name: data.name.trim().toLowerCase(), muscleGroup: data.muscleGroup, description: data.description } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("Exercise already exists", { cause: "EXERCISE_ALREADY_EXISTS" });
    throw error;
  }
};
export const getExercises = () => prisma.exercise.findMany({ orderBy: [{ muscleGroup: "asc" }, { name: "asc" }] });
