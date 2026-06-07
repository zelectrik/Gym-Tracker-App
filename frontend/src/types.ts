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
export type ProgressionType = "WEIGHT" | "ASSISTED_WEIGHT" | "DURATION";
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
  trackingType: ExerciseTrackingType;
  progressionType: ProgressionType;
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


export type CardioEntry = {
  id: string;
  sessionExerciseId: string;
  durationSec?: number | null;
  distanceKm?: number | null;
  calories?: number | null;
  speedKmh?: number | null;
  inclinePercent?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  watts?: number | null;
  rpm?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  cardioEntry?: CardioEntry | null;
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


export type BodySnapshot = {
  id: string;
  userId: string;
  measuredAt: string;
  weightKg?: number | null;
  neckCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BodySnapshotPayload = {
  measuredAt: string;
  weightKg?: number;
  neckCm?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
};


export type BodyMetric =
  | "WEIGHT_KG"
  | "NECK_CM"
  | "CHEST_CM"
  | "WAIST_CM"
  | "HIPS_CM"
  | "ARM_CM"
  | "THIGH_CM"
  | "CHEST_WAIST_RATIO";

export type BodyGoalType =
  | "LOSS"
  | "GAIN"
  | "MAINTAIN_ABOVE"
  | "MAINTAIN_BELOW";

export type BodyGoal = {
  id: string;
  userId: string;
  metric: BodyMetric;
  goalType: BodyGoalType;
  level: number;
  targetValue: number;
  tolerance?: number | null;
  deadline?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BodyGoalPayload = {
  metric: BodyMetric;
  goalType: BodyGoalType;
  level?: number;
  targetValue: number;
  tolerance?: number;
  deadline?: string;
  notes?: string;
  isActive?: boolean;
};

export type LastExercisePerformance = {
  exerciseId: string;
  exerciseName: string;
  sessionId: string;
  sessionTitle: string;
  completedAt: string;
  sets: Array<{
    setNumber: number;
    side: ExerciseSide;
    reps?: number | null;
    weightKg?: number | null;
    durationSec?: number | null;
    distanceMeters?: number | null;
  }>;
  cardioEntry?: CardioEntry | null;
};

export type ExerciseTrackingType = "STRENGTH" | "CARDIO";
