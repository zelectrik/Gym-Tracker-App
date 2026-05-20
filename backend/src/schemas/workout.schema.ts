import { z } from "zod";

export const workoutStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const optionalDate = z.string().datetime().optional();

export const createWorkoutTemplateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().uuid(),
    position: z.number().int().min(1),
    targetSets: z.number().int().min(1),
    targetReps: z.number().int().min(1).optional(),
    targetDurationSec: z.number().int().min(1).optional(),
    restSeconds: z.number().int().min(0).optional(),
    notes: z.string().trim().optional(),
  })).min(1),
});

export const createWorkoutSessionSchema = z.object({
  title: z.string().trim().min(1),
  templateId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).min(1).optional(),
  scheduledAt: optionalDate,
  exercises: z.array(z.object({
    exerciseId: z.string().uuid(),
    position: z.number().int().min(1),
    notes: z.string().trim().optional(),
    sets: z.array(z.object({
      setNumber: z.number().int().min(1),
      reps: z.number().int().min(1).optional(),
      weightKg: z.number().min(0).optional(),
      durationSec: z.number().int().min(1).optional(),
      distanceMeters: z.number().int().min(1).optional(),
      completed: z.boolean().optional(),
    })).optional(),
  })).optional(),
});

export const updateWorkoutStatusSchema = z.object({
  status: z.enum(workoutStatuses),
});

export const addSetSchema = z.object({
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1).optional(),
  weightKg: z.number().min(0).optional(),
  durationSec: z.number().int().min(1).optional(),
  distanceMeters: z.number().int().min(1).optional(),
  completed: z.boolean().optional(),
});
