import { prisma } from "../lib/prisma";

export const getUserProgress = async (userId: string) => {
  const sessions = await prisma.workoutSession.findMany({
    where: { status: "COMPLETED", participants: { some: { userId } } },
    include: { exercises: { include: { exercise: true, sets: true } } },
    orderBy: { completedAt: "desc" },
  });
  const totalSessions = sessions.length;
  const totalSets = sessions.flatMap((s) => s.exercises).flatMap((e) => e.sets).filter((set) => set.completed).length;
  const totalVolumeKg = sessions.flatMap((s) => s.exercises).flatMap((e) => e.sets).reduce((sum, set) => sum + ((set.weightKg ?? 0) * (set.reps ?? 0)), 0);
  return { totalSessions, totalSets, totalVolumeKg, recentSessions: sessions.slice(0, 10) };
};
