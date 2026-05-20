import type {
  Exercise,
  ExerciseSide,
  ExecutionMode,
  MuscleGroup,
  Progress,
  User,
  WorkoutSession,
  WorkoutStatus,
  WorkoutTemplate,
  ImportProgramPayload,
  ImportProgramResult,
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
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof data?.error === "string" ? data.error : "Erreur API",
    );
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
  progress: () => request<Progress>("/progress"),
};
