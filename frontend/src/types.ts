export type UserRole = "USER" | "SUPER_ADMIN";
export type WorkoutStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type MuscleGroup =
  | "CHEST"
  | "UPPER_CHEST"
  | "BACK"
  | "LATS"
  | "TRAPS"
  | "SHOULDERS"
  | "FRONT_SHOULDERS"
  | "REAR_SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "FOREARMS"
  | "ABS"
  | "OBLIQUES"
  | "LOWER_BACK"
  | "QUADS"
  | "HAMSTRINGS"
  | "GLUTES"
  | "CALVES"
  | "ADDUCTORS"
  | "ABDUCTORS"
  | "CARDIO"
  | "CORE"
  | "FULL_BODY";
export type MuscleTag =
  | "pectoraux"
  | "haut_pectoraux"
  | "dos"
  | "grand_dorsal"
  | "trapezes"
  | "epaules"
  | "epaules_laterales"
  | "avant_epaules"
  | "arriere_epaules"
  | "biceps"
  | "triceps"
  | "avant_bras"
  | "abdominaux"
  | "obliques"
  | "lombaires"
  | "bas_dos"
  | "quadriceps"
  | "ischios"
  | "fessiers"
  | "mollets"
  | "adducteurs"
  | "abducteurs"
  | "jambes"
  | "cardio"
  | "core"
  | "full_body";
export type ExerciseType =
  | "machine"
  | "dumbbell"
  | "barbell"
  | "cable"
  | "bodyweight"
  | "cardio";
export type ExerciseSide = "BOTH" | "LEFT" | "RIGHT";
export type ExecutionMode = "BILATERAL" | "LEFT_RIGHT";

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};
export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  muscles: MuscleTag[];
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
export type TemplateExercise = {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  position: number;
  targetSets: number;
  targetReps?: number | null;
  targetDurationSec?: number | null;
  restSeconds?: number | null;
  executionMode: ExecutionMode;
  targetWeightKg?: number | null;
  leftWeightKg?: number | null;
  rightWeightKg?: number | null;
  notes?: string | null;
};
export type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string | null;
  exercises: TemplateExercise[];
  createdAt?: string;
};
export type ExerciseSet = {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  side: ExerciseSide;
  reps?: number | null;
  weightKg?: number | null;
  durationSec?: number | null;
  distanceMeters?: number | null;
  completed?: boolean;
};
export type SessionExercise = {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  position: number;
  targetSets?: number | null;
  targetReps?: number | null;
  targetDurationSec?: number | null;
  restSeconds?: number | null;
  executionMode: ExecutionMode;
  targetWeightKg?: number | null;
  leftWeightKg?: number | null;
  rightWeightKg?: number | null;
  notes?: string | null;
  sets: ExerciseSet[];
};
export type WorkoutSession = {
  id: string;
  title: string;
  status: WorkoutStatus;
  templateId?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  exercises: SessionExercise[];
  participants: { user: Pick<User, "id" | "email" | "displayName"> }[];
  createdAt?: string;
};
export type Progress = {
  totalSessions: number;
  totalSets: number;
  totalVolumeKg: number;
  recentSessions: WorkoutSession[];
};

export type ImportProgramExercise = {
  exerciseName: string;
  reference?: string;
  category?: string;
  sets: number;
  reps?: number | [number, number];
  durationSeconds?: number | [number, number];
  unilateral?: boolean;
  muscles?: string[];
};
export type ImportProgramPayload = {
  program: Array<{
    name: string;
    type?: string;
    exercises: ImportProgramExercise[];
  }>;
};
export type ImportProgramResult = {
  importedCount: number;
  templates: WorkoutTemplate[];
};
