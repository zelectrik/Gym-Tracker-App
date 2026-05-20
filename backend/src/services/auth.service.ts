import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export const sanitizeUser = (user: {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}) => user;

export const register = async (data: {
  email: string;
  password: string;
  displayName: string;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing)
    throw new Error("User already exists", { cause: "USER_ALREADY_EXISTS" });
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      displayName: data.displayName,
      role: "USER",
    },
    select: { id: true, email: true, role: true, displayName: true },
  });
  return user;
};

export const login = async (data: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash)))
    throw new Error("Invalid credentials", { cause: "INVALID_CREDENTIALS" });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return {
    token,
    user: sanitizeUser({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    }),
  };
};

export const verifyAuthToken = (token: string) =>
  jwt.verify(token, JWT_SECRET) as { userId: string };
export const getUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, displayName: true },
  });
