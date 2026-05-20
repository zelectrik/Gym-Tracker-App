import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearTestDatabase } from "./helpers/database";

beforeEach(async () => {
  await clearTestDatabase();
});
afterAll(async () => {
  await prisma.$disconnect();
});
