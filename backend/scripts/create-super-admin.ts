import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required");
}

const main = async () => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN" },
    create: { email, passwordHash, displayName: "Super Admin", role: "SUPER_ADMIN" },
  });
  console.log(`Super admin ready: ${user.email}`);
};

main().finally(async () => prisma.$disconnect());
