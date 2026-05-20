import { prisma } from "../lib/prisma";

const includeTemplate = {
  exercises: {
    include: { exercise: true },
    orderBy: { position: "asc" as const },
  },
};

const includeSession = {
  participants: {
    include: {
      user: { select: { id: true, email: true, displayName: true } },
    },
  },
  exercises: {
    include: {
      exercise: true,
      sets: { orderBy: [{ setNumber: "asc" as const }, { side: "asc" as const }] },
    },
    orderBy: { position: "asc" as const },
  },
};

export const createTemplate = (ownerId: string, data: any) => prisma.workoutTemplate.create({
  data: {
    name: data.name,
    description: data.description,
    ownerId,
    exercises: { create: data.exercises },
  },
  include: includeTemplate,
});

export const getTemplates = (ownerId: string) => prisma.workoutTemplate.findMany({
  where: { ownerId },
  include: includeTemplate,
  orderBy: { createdAt: "desc" },
});

export const createSession = async (ownerId: string, data: any) => {
  const participantIds = Array.from(new Set([ownerId, ...(data.participantIds ?? [])]));

  return prisma.workoutSession.create({
    data: {
      title: data.title,
      templateId: data.templateId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      participants: { create: participantIds.map((userId) => ({ userId })) },
      exercises: data.exercises
        ? {
            create: data.exercises.map((exercise: any) => ({
              exerciseId: exercise.exerciseId,
              position: exercise.position,
              notes: exercise.notes,
              sets: exercise.sets
                ? {
                    create: exercise.sets.map((set: any) => ({
                      ...set,
                      side: set.side ?? "BOTH",
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    },
    include: includeSession,
  });
};

export const getSessionsForUser = (userId: string) => prisma.workoutSession.findMany({
  where: { participants: { some: { userId } } },
  include: includeSession,
  orderBy: { createdAt: "desc" },
});

export const updateSessionStatus = (
  sessionId: string,
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
) => prisma.workoutSession.update({
  where: { id: sessionId },
  data: {
    status,
    startedAt: status === "IN_PROGRESS" ? new Date() : undefined,
    completedAt: status === "COMPLETED" ? new Date() : undefined,
  },
  include: includeSession,
});

export const addSet = (sessionExerciseId: string, data: any) => prisma.exerciseSet.upsert({
  where: {
    sessionExerciseId_setNumber_side: {
      sessionExerciseId,
      setNumber: data.setNumber,
      side: data.side ?? "BOTH",
    },
  },
  update: { ...data, side: data.side ?? "BOTH" },
  create: { ...data, side: data.side ?? "BOTH", sessionExerciseId },
});
