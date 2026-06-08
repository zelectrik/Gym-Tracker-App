import type {
  Exercise,
  ExerciseSide,
  ExecutionMode,
  MuscleGroup,
  Progress,
  ProgressionType,
  User,
  SessionExercise,
  WorkoutSession,
  WorkoutStatus,
  WorkoutTemplate,
  ImportProgramPayload,
  ImportProgramResult,
  LastExercisePerformance,
  CardioEntry,
  BodySnapshot,
  BodySnapshotPayload,
  BodyGoal,
  BodyGoalPayload,
  NutritionEntry,
  NutritionEntryPayload,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const tokenKey = "gym-tracker-token";
export const authStore = {
  getToken: () => localStorage.getItem(tokenKey),
  setToken: (token: string) => localStorage.setItem(tokenKey, token),
  clear: () => localStorage.removeItem(tokenKey),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStore.getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await res.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Erreur API";

    throw new ApiError(res.status, errorMessage);
  }

  return data as T;
}

export const api = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<User>("/auth/me"),
  exercises: () => request<Exercise[]>("/exercises"),
  createExercise: (body: {
    name: string;
    muscleGroup: MuscleGroup;
    progressionType?: ProgressionType;
    description?: string;
  }) =>
    request<Exercise>("/exercises", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  templates: () => request<WorkoutTemplate[]>("/workouts/templates"),
  importProgramTemplates: (body: ImportProgramPayload) =>
    request<ImportProgramResult>("/workouts/templates/import-json", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateTemplate: (templateId: string, body: {
    name: string;
    description?: string;
    exercises: Array<{
      exerciseId: string;
      position: number;
      targetSets: number;
      targetReps?: number;
      targetDurationSec?: number;
      restSeconds?: number;
      executionMode?: ExecutionMode;
      targetWeightKg?: number;
      leftWeightKg?: number;
      rightWeightKg?: number;
      notes?: string;
    }>;
  }) =>
    request<WorkoutTemplate>(`/workouts/templates/${templateId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTemplate: (templateId: string) =>
    request(`/workouts/templates/${templateId}`, {
      method: "DELETE",
    }),

  createTemplate: (body: {
    name: string;
    description?: string;
    exercises: Array<{
      exerciseId: string;
      position: number;
      targetSets: number;
      targetReps?: number;
      targetDurationSec?: number;
      restSeconds?: number;
      executionMode?: ExecutionMode;
      targetWeightKg?: number;
      leftWeightKg?: number;
      rightWeightKg?: number;
      notes?: string;
    }>;
  }) =>
    request<WorkoutTemplate>("/workouts/templates", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  sessions: () => request<WorkoutSession[]>("/workouts/sessions"),
  lastExercisePerformance: (exerciseId: string) =>
    request<LastExercisePerformance | null>(
      `/workouts/exercises/${exerciseId}/last-performance`,
    ),
  createSession: (body: {
    title: string;
    templateId?: string;
    exercises?: Array<{
      exerciseId: string;
      position: number;
      targetSets?: number;
      targetReps?: number;
      targetDurationSec?: number;
      restSeconds?: number;
      executionMode?: ExecutionMode;
      targetWeightKg?: number;
      leftWeightKg?: number;
      rightWeightKg?: number;
      notes?: string;
    }>;
  }) =>
    request<WorkoutSession>("/workouts/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateSessionStatus: (sessionId: string, status: WorkoutStatus) =>
    request<WorkoutSession>(`/workouts/sessions/${sessionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteSession: (sessionId: string) =>
    request(`/workouts/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  addSessionExercise: (sessionId: string, body: {
    exerciseId: string;
    targetSets?: number;
    targetReps?: number;
    targetDurationSec?: number;
    restSeconds?: number;
    executionMode?: ExecutionMode;
    targetWeightKg?: number;
    leftWeightKg?: number;
    rightWeightKg?: number;
    notes?: string;
  }) =>
    request<SessionExercise>(`/workouts/sessions/${sessionId}/exercises`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  exerciseSuggestions: (sessionExerciseId: string) =>
    request<Array<Exercise & { score?: number }>>(
      `/workouts/session-exercises/${sessionExerciseId}/suggestions`,
    ),
  replaceSessionExercise: (sessionExerciseId: string, exerciseId: string) =>
    request<SessionExercise>(`/workouts/session-exercises/${sessionExerciseId}/replace`, {
      method: "PATCH",
      body: JSON.stringify({ exerciseId }),
    }),
  removeSessionExercise: (sessionExerciseId: string) =>
    request(`/workouts/session-exercises/${sessionExerciseId}`, {
      method: "DELETE",
    }),
  addSet: (
    sessionExerciseId: string,
    body: {
      setNumber: number;
      side?: ExerciseSide;
      reps?: number;
      weightKg?: number;
      durationSec?: number;
      distanceMeters?: number;
      completed?: boolean;
    },
  ) =>
    request(`/workouts/session-exercises/${sessionExerciseId}/sets`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  upsertCardioEntry: (
    sessionExerciseId: string,
    body: {
      durationSec?: number;
      distanceKm?: number;
      calories?: number;
      speedKmh?: number;
      inclinePercent?: number;
      avgHeartRate?: number;
      maxHeartRate?: number;
      watts?: number;
      rpm?: number;
      notes?: string;
    },
  ) =>
    request<CardioEntry>(`/workouts/session-exercises/${sessionExerciseId}/cardio-entry`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  progress: () => request<Progress>("/progress"),
  bodySnapshots: () => request<BodySnapshot[]>("/body/snapshots"),
  saveBodySnapshot: (body: BodySnapshotPayload) =>
    request<BodySnapshot>("/body/snapshots", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  bodyGoals: () => request<BodyGoal[]>("/body/goals"),
  saveBodyGoal: (body: BodyGoalPayload) =>
    request<BodyGoal>("/body/goals", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteBodyGoal: (goalId: string) =>
    request(`/body/goals/${goalId}`, {
      method: "DELETE",
    }),
  nutritionEntries: (range?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (range?.startDate) params.set("startDate", range.startDate);
    if (range?.endDate) params.set("endDate", range.endDate);
    const query = params.toString();
    return request<NutritionEntry[]>(`/nutrition/entries${query ? `?${query}` : ""}`);
  },
  saveNutritionEntry: (body: NutritionEntryPayload) =>
    request<NutritionEntry>("/nutrition/entries", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteNutritionEntry: (entryId: string) =>
    request(`/nutrition/entries/${entryId}`, {
      method: "DELETE",
    }),
};
