import { prisma } from "../lib/prisma";

type ExerciseSide = "BOTH" | "LEFT" | "RIGHT";
type ExecutionMode = "BILATERAL" | "LEFT_RIGHT";

type PlannedExerciseInput = {
  exerciseId: string;
  position: number;
  targetSets?: number;
  targetReps?: number | null;
  restSeconds?: number | null;
  executionMode?: ExecutionMode;
  targetWeightKg?: number | null;
  leftWeightKg?: number | null;
  rightWeightKg?: number | null;
  notes?: string | null;
  sets?: Array<{
    setNumber: number;
    side?: ExerciseSide;
    reps?: number | null;
    weightKg?: number | null;
    completed?: boolean;
  }>;
};

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

function buildPlannedSets(exercise: PlannedExerciseInput) {
  if (exercise.sets?.length) {
    return exercise.sets.map((set) => ({
      setNumber: set.setNumber,
      side: set.side ?? "BOTH",
      reps: set.reps ?? exercise.targetReps ?? undefined,
      weightKg: set.weightKg ?? defaultWeightForSide(exercise, set.side ?? "BOTH"),
      completed: set.completed ?? false,
    }));
  }

  const targetSets = exercise.targetSets ?? 3;
  const sides: ExerciseSide[] = exercise.executionMode === "LEFT_RIGHT" ? ["LEFT", "RIGHT"] : ["BOTH"];

  return Array.from({ length: targetSets }).flatMap((_, index) =>
    sides.map((side) => ({
      setNumber: index + 1,
      side,
      reps: exercise.targetReps ?? undefined,
      weightKg: defaultWeightForSide(exercise, side),
      completed: false,
    })),
  );
}

function defaultWeightForSide(exercise: PlannedExerciseInput, side: ExerciseSide) {
  if (side === "LEFT") return exercise.leftWeightKg ?? exercise.targetWeightKg ?? undefined;
  if (side === "RIGHT") return exercise.rightWeightKg ?? exercise.targetWeightKg ?? undefined;
  return exercise.targetWeightKg ?? undefined;
}

function toSessionExerciseCreate(exercise: PlannedExerciseInput) {
  return {
    exerciseId: exercise.exerciseId,
    position: exercise.position,
    targetSets: exercise.targetSets ?? 3,
    targetReps: exercise.targetReps ?? undefined,
    restSeconds: exercise.restSeconds ?? undefined,
    executionMode: exercise.executionMode ?? "BILATERAL",
    targetWeightKg: exercise.targetWeightKg ?? undefined,
    leftWeightKg: exercise.leftWeightKg ?? undefined,
    rightWeightKg: exercise.rightWeightKg ?? undefined,
    notes: exercise.notes ?? undefined,
    sets: { create: buildPlannedSets(exercise) },
  };
}

export const createTemplate = (ownerId: string, data: any) =>
  prisma.workoutTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId,
      exercises: {
        create: data.exercises.map((exercise: PlannedExerciseInput) => ({
          exerciseId: exercise.exerciseId,
          position: exercise.position,
          targetSets: exercise.targetSets ?? 3,
          targetReps: exercise.targetReps ?? undefined,
          targetDurationSec: (exercise as any).targetDurationSec ?? undefined,
          restSeconds: exercise.restSeconds ?? undefined,
          executionMode: exercise.executionMode ?? "BILATERAL",
          targetWeightKg: exercise.targetWeightKg ?? undefined,
          leftWeightKg: exercise.leftWeightKg ?? undefined,
          rightWeightKg: exercise.rightWeightKg ?? undefined,
          notes: exercise.notes ?? undefined,
        })),
      },
    },
    include: includeTemplate,
  });

export const getTemplates = (ownerId: string) =>
  prisma.workoutTemplate.findMany({
    where: { ownerId },
    include: includeTemplate,
    orderBy: { createdAt: "desc" },
  });

export const createSession = async (ownerId: string, data: any) => {
  const participantIds = Array.from(new Set([ownerId, ...(data.participantIds ?? [])]));

  let plannedExercises: PlannedExerciseInput[] = data.exercises ?? [];

  if (!plannedExercises.length && data.templateId) {
    const template = await prisma.workoutTemplate.findFirst({
      where: { id: data.templateId, ownerId },
      include: { exercises: { orderBy: { position: "asc" } } },
    });

    if (!template) throw new Error("Workout template not found");

    plannedExercises = template.exercises.map((exercise: any) => ({
      exerciseId: exercise.exerciseId,
      position: exercise.position,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      restSeconds: exercise.restSeconds,
      executionMode: exercise.executionMode,
      targetWeightKg: exercise.targetWeightKg,
      leftWeightKg: exercise.leftWeightKg,
      rightWeightKg: exercise.rightWeightKg,
      notes: exercise.notes,
    }));
  }

  return prisma.workoutSession.create({
    data: {
      title: data.title,
      templateId: data.templateId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      participants: { create: participantIds.map((userId) => ({ userId })) },
      exercises: plannedExercises.length
        ? { create: plannedExercises.map(toSessionExerciseCreate) }
        : undefined,
    },
    include: includeSession,
  });
};

export const getSessionsForUser = (userId: string) =>
  prisma.workoutSession.findMany({
    where: { participants: { some: { userId } } },
    include: includeSession,
    orderBy: { createdAt: "desc" },
  });

export const updateSessionStatus = (
  sessionId: string,
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
) =>
  prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status,
      startedAt: status === "IN_PROGRESS" ? new Date() : undefined,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
    include: includeSession,
  });

export const addSet = (sessionExerciseId: string, data: any) =>
  prisma.exerciseSet.upsert({
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
