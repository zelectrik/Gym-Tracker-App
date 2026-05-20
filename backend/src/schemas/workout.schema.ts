import { z } from "zod";

export const workoutStatuses = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export const exerciseSides = ["BOTH", "LEFT", "RIGHT"] as const;
export const executionModes = ["BILATERAL", "LEFT_RIGHT"] as const;

const optionalDate = z.string().datetime().optional();

const plannedExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  position: z.number().int().min(1),
  targetSets: z.number().int().min(1).default(3),
  targetReps: z.number().int().min(1).optional(),
  targetDurationSec: z.number().int().min(1).optional(),
  restSeconds: z.number().int().min(0).optional(),
  executionMode: z.enum(executionModes).default("BILATERAL"),
  targetWeightKg: z.number().min(0).optional(),
  leftWeightKg: z.number().min(0).optional(),
  rightWeightKg: z.number().min(0).optional(),
  notes: z.string().trim().optional(),
});

const setSchema = z.object({
  setNumber: z.number().int().min(1),
  side: z.enum(exerciseSides).optional(),
  reps: z.number().int().min(0).optional(),
  weightKg: z.number().min(0).optional(),
  durationSec: z.number().int().min(1).optional(),
  distanceMeters: z.number().int().min(1).optional(),
  completed: z.boolean().optional(),
});

export const createWorkoutTemplateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  exercises: z.array(plannedExerciseSchema).min(1),
});

export const createWorkoutSessionSchema = z.object({
  title: z.string().trim().min(1),
  templateId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).min(1).optional(),
  scheduledAt: optionalDate,
  exercises: z.array(plannedExerciseSchema.extend({ sets: z.array(setSchema).optional() })).optional(),
});

export const updateWorkoutStatusSchema = z.object({
  status: z.enum(workoutStatuses),
});

export const addSetSchema = setSchema;
