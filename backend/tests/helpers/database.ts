import bcrypt from "bcryptjs";
import request from "supertest";
import { expect } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { app } from "../../src/app";

export const clearTestDatabase = async () => {
  await prisma.exerciseSet.deleteMany();
  await prisma.sessionExercise.deleteMany();
  await prisma.workoutParticipant.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.templateExercise.deleteMany();
  await prisma.workoutTemplate.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();
};

export const createUser = async (email = "thibault@test.dev") => {
  const passwordHash = await bcrypt.hash("password123", 10);
  return prisma.user.create({ data: { email, passwordHash, displayName: "Thibault", role: "USER" } });
};

export const getUserToken = async (email = "thibault@test.dev") => {
  await createUser(email);
  const response = await request(app).post("/auth/login").send({ email, password: "password123" });
  expect(response.status).toBe(200);
  return response.body.token as string;
};
