import { MuscleGroup, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

type ExerciseSide = "BOTH" | "LEFT" | "RIGHT";
type ExecutionMode = "BILATERAL" | "LEFT_RIGHT";

type PlannedExerciseInput = {
  exerciseId: string;
  position: number;
  targetSets?: number;
  targetReps?: number | null;
  targetDurationSec?: number | null;
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
    durationSec?: number | null;
    distanceMeters?: number | null;
    completed?: boolean;
  }>;
};

type ImportedProgramExercise = {
  exerciseName: string;
  reference?: string;
  category?: string;
  sets: number;
  reps?: number | [number, number];
  durationSeconds?: number | [number, number];
  unilateral?: boolean;
  muscles?: string[];
};

type ImportedProgram = {
  name: string;
  type?: string;
  exercises: ImportedProgramExercise[];
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
      sets: {
        orderBy: [{ setNumber: "asc" as const }, { side: "asc" as const }],
      },
    },
    orderBy: { position: "asc" as const },
  },
};

const referenceToFrenchName: Record<string, string> = {
  "leg press": "presse à cuisses",
  "chest press": "presse à pectoraux",
  "seated row": "rowing assis",
  "hip thrust machine": "hip thrust à la machine",
  "elevations laterales": "élévations latérales",
  "élévations laterales": "élévations latérales",
  gainage: "gainage",
  "smith machine": "smith machine",
  "developpe incline halteres": "développé incliné haltères",
  "développé incliné haltères": "développé incliné haltères",
  "lat pulldown": "tirage vertical",
  "romanian deadlift": "soulevé de terre roumain",
  "curl biceps halteres": "curl biceps haltères",
  "curl biceps haltères": "curl biceps haltères",
  "rope pushdown": "extension triceps corde",
  "abdominal crunch machine": "crunch abdominal à la machine",
  "fentes marchees": "fentes marchées",
  "fentes marchées": "fentes marchées",
  "shoulder press": "presse à épaules",
  "leg curl assis": "curl ischios assis",
  "developpe couche halteres": "développé couché haltères",
  "développé couché haltères": "développé couché haltères",
  "rowing haltere": "rowing haltère",
  "rowing haltère": "rowing haltère",
  "triceps pushdown": "extension triceps à la poulie",
};

const muscleGroupByTag: Record<string, MuscleGroup> = {
  pectoraux: "CHEST",
  haut_pectoraux: "CHEST",
  dos: "BACK",
  grand_dorsal: "BACK",
  rhomboides: "BACK",
  rhomboïdes: "BACK",
  trapezes: "BACK",
  epaules: "SHOULDERS",
  epaules_laterales: "SHOULDERS",
  épaules_laterales: "SHOULDERS",
  avant_epaules: "SHOULDERS",
  arriere_epaules: "SHOULDERS",
  biceps: "BICEPS",
  triceps: "TRICEPS",
  avant_bras: "BICEPS",
  abdominaux: "ABS",
  obliques: "ABS",
  lombaires: "BACK",
  bas_dos: "BACK",
  quadriceps: "QUADS",
  ischios: "HAMSTRINGS",
  fessiers: "GLUTES",
  mollets: "CALVES",
  adducteurs: "ADDUCTORS",
  abducteurs: "ABDUCTORS",
  jambes: "QUADS",
  cardio: "CARDIO",
  core: "ABS",
  full_body: "FULL_BODY",
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeLookup(value: string) {
  return normalizeName(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeMuscleTag(value: string) {
  return normalizeLookup(value).replaceAll(" ", "_");
}

function getPrimaryMuscleGroup(
  muscles: string[] | undefined,
  category?: string,
): MuscleGroup {
  if (category === "cardio") return "CARDIO";
  const firstMuscle = muscles?.[0] ? normalizeMuscleTag(muscles[0]) : undefined;
  return firstMuscle
    ? (muscleGroupByTag[firstMuscle] ?? "FULL_BODY")
    : "FULL_BODY";
}

function firstValue(value: number | [number, number] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function rangeLabel(
  label: string,
  value: number | [number, number] | undefined,
) {
  if (!Array.isArray(value)) return undefined;
  return `${label}: ${value[0]}-${value[1]}`;
}

function buildImportNotes(exercise: ImportedProgramExercise) {
  const parts = [
    exercise.reference ? `Référence: ${exercise.reference}` : undefined,
    exercise.category ? `Catégorie: ${exercise.category}` : undefined,
    exercise.muscles?.length
      ? `Muscles: ${exercise.muscles.join(", ")}`
      : undefined,
    rangeLabel("Reps", exercise.reps),
    rangeLabel("Durée", exercise.durationSeconds),
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : undefined;
}

async function findOrCreateExerciseFromImport(
  exercise: ImportedProgramExercise,
) {
  const rawReference = exercise.reference
    ? normalizeLookup(exercise.reference)
    : undefined;
  const mappedReferenceName = rawReference
    ? referenceToFrenchName[rawReference]
    : undefined;
  const candidateNames = [
    mappedReferenceName,
    exercise.exerciseName,
    exercise.reference,
  ]
    .filter(Boolean)
    .map((name) => normalizeName(name as string));

  const existing = await prisma.exercise.findFirst({
    where: { name: { in: candidateNames } },
  });

  if (existing) return existing;

  return prisma.exercise.create({
    data: {
      name: normalizeName(exercise.exerciseName),
      type: exercise.category ?? "machine",
      muscles: exercise.muscles?.map(normalizeMuscleTag) ?? [],
      muscleGroup: getPrimaryMuscleGroup(exercise.muscles, exercise.category),
      description: buildImportNotes(exercise),
    },
  });
}

function buildPlannedSets(exercise: PlannedExerciseInput) {
  if (exercise.sets?.length) {
    return exercise.sets.map((set) => ({
      setNumber: set.setNumber,
      side: set.side ?? "BOTH",
      reps: set.reps ?? exercise.targetReps ?? undefined,
      weightKg:
        set.weightKg ?? defaultWeightForSide(exercise, set.side ?? "BOTH"),
      durationSec: set.durationSec ?? exercise.targetDurationSec ?? undefined,
      distanceMeters: set.distanceMeters ?? undefined,
      completed: set.completed ?? false,
    }));
  }

  const targetSets = exercise.targetSets ?? 3;
  const sides: ExerciseSide[] =
    exercise.executionMode === "LEFT_RIGHT" ? ["LEFT", "RIGHT"] : ["BOTH"];

  return Array.from({ length: targetSets }).flatMap((_, index) =>
    sides.map((side) => ({
      setNumber: index + 1,
      side,
      reps: exercise.targetReps ?? undefined,
      weightKg: defaultWeightForSide(exercise, side),
      durationSec: exercise.targetDurationSec ?? undefined,
      completed: false,
    })),
  );
}

function defaultWeightForSide(
  exercise: PlannedExerciseInput,
  side: ExerciseSide,
) {
  if (side === "LEFT")
    return exercise.leftWeightKg ?? exercise.targetWeightKg ?? undefined;
  if (side === "RIGHT")
    return exercise.rightWeightKg ?? exercise.targetWeightKg ?? undefined;
  return exercise.targetWeightKg ?? undefined;
}

function toSessionExerciseCreate(exercise: PlannedExerciseInput) {
  return {
    exerciseId: exercise.exerciseId,
    position: exercise.position,
    targetSets: exercise.targetSets ?? 3,
    targetReps: exercise.targetReps ?? undefined,
    targetDurationSec: exercise.targetDurationSec ?? undefined,
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
          targetDurationSec: exercise.targetDurationSec ?? undefined,
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

export const importProgramTemplates = async (
  ownerId: string,
  data: { program: ImportedProgram[] },
) => {
  const imported = [];

  for (const program of data.program) {
    await prisma.workoutTemplate.deleteMany({
      where: { ownerId, name: program.name },
    });

    const plannedExercises = [];

    for (const [index, item] of program.exercises.entries()) {
      const exercise = await findOrCreateExerciseFromImport(item);
      plannedExercises.push({
        exerciseId: exercise.id,
        position: index + 1,
        targetSets: item.sets,
        targetReps: firstValue(item.reps),
        targetDurationSec: firstValue(item.durationSeconds),
        executionMode: item.unilateral ? "LEFT_RIGHT" : "BILATERAL",
        notes: buildImportNotes(item),
      });
    }

    imported.push(
      await createTemplate(ownerId, {
        name: program.name,
        description: program.type
          ? `Programme importé · ${program.type}`
          : "Programme importé depuis JSON",
        exercises: plannedExercises,
      }),
    );
  }

  return {
    importedCount: imported.length,
    templates: imported,
  };
};

export const getTemplates = (ownerId: string) =>
  prisma.workoutTemplate.findMany({
    where: { ownerId },
    include: includeTemplate,
    orderBy: { createdAt: "desc" },
  });

export const createSession = async (ownerId: string, data: any) => {
  const participantIds = Array.from(
    new Set([ownerId, ...(data.participantIds ?? [])]),
  );

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
      targetDurationSec: exercise.targetDurationSec,
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


export const getLastExercisePerformance = async (userId: string, exerciseId: string) => {
  const lastSessionExercise = await prisma.sessionExercise.findFirst({
    where: {
      exerciseId,
      sets: { some: { completed: true } },
      session: {
        status: "COMPLETED",
        participants: { some: { userId } },
      },
    },
    include: {
      exercise: true,
      sets: {
        where: { completed: true },
        orderBy: [{ setNumber: "asc" }, { side: "asc" }],
      },
      session: {
        select: {
          id: true,
          title: true,
          completedAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      { session: { completedAt: "desc" } },
      { session: { createdAt: "desc" } },
    ],
  });

  if (!lastSessionExercise) return null;

  return {
    exerciseId,
    exerciseName: lastSessionExercise.exercise.name,
    sessionId: lastSessionExercise.session.id,
    sessionTitle: lastSessionExercise.session.title,
    completedAt: lastSessionExercise.session.completedAt ?? lastSessionExercise.session.createdAt,
    sets: lastSessionExercise.sets.map((set) => ({
      setNumber: set.setNumber,
      side: set.side,
      reps: set.reps,
      weightKg: set.weightKg,
      durationSec: set.durationSec,
      distanceMeters: set.distanceMeters,
    })),
  };
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

export const updateTemplate = async (
  ownerId: string,
  templateId: string,
  data: any,
) => {
  await prisma.templateExercise.deleteMany({
    where: { workoutTemplateId: templateId },
  });

  return prisma.workoutTemplate.update({
    where: { id: templateId, ownerId },
    data: {
      name: data.name,
      description: data.description,
      exercises: {
        create: data.exercises,
      },
    },
    include: includeTemplate,
  });
};

export const deleteTemplate = async (ownerId: string, templateId: string) => {
  return prisma.workoutTemplate.delete({
    where: { id: templateId, ownerId },
  });
};
