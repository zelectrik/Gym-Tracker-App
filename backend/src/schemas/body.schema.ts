import { z } from "zod";

const optionalPositiveNumber = z.number().positive().optional();
const bodyMetricSchema = z.enum([
  "WEIGHT_KG",
  "NECK_CM",
  "CHEST_CM",
  "WAIST_CM",
  "HIPS_CM",
  "ARM_CM",
  "THIGH_CM",
]);

export const createBodySnapshotSchema = z.object({
  measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format YYYY-MM-DD"),
  weightKg: optionalPositiveNumber,
  neckCm: optionalPositiveNumber,
  chestCm: optionalPositiveNumber,
  waistCm: optionalPositiveNumber,
  hipsCm: optionalPositiveNumber,
  armCm: optionalPositiveNumber,
  thighCm: optionalPositiveNumber,
  notes: z.string().trim().optional(),
});

export const createBodyGoalSchema = z.object({
  metric: bodyMetricSchema,
  level: z.number().int().min(1).max(20),
  targetValue: z.number().positive(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format YYYY-MM-DD").optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});
