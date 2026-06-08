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
const bodyGoalTypeSchema = z.enum([
  "LOSS",
  "GAIN",
  "MAINTAIN_ABOVE",
  "MAINTAIN_BELOW",
]);

export const createBodySnapshotSchema = z.object({
  measuredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format YYYY-MM-DD"),
  weightKg: optionalPositiveNumber,
  neckCm: optionalPositiveNumber,
  chestCm: optionalPositiveNumber,
  waistCm: optionalPositiveNumber,
  hipsCm: optionalPositiveNumber,
  armCm: optionalPositiveNumber,
  thighCm: optionalPositiveNumber,
  notes: z.string().trim().optional(),
});

export const createBodyGoalSchema = z
  .object({
    metric: bodyMetricSchema,
    goalType: bodyGoalTypeSchema.default("LOSS"),
    level: z.number().int().min(0).max(20).optional(),
    targetValue: z.number().positive(),
    tolerance: z.number().positive().optional(),
    deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format YYYY-MM-DD")
      .optional(),
    notes: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  })
  .transform((data) => {
    const isMaintain =
      data.goalType === "MAINTAIN_ABOVE" || data.goalType === "MAINTAIN_BELOW";
    return {
      ...data,
      level: isMaintain ? 0 : (data.level ?? 1),
      deadline: isMaintain ? undefined : data.deadline,
    };
  })
  .refine(
    (data) =>
      data.goalType === "MAINTAIN_ABOVE" ||
      data.goalType === "MAINTAIN_BELOW" ||
      data.level >= 1,
    {
      message:
        "Le niveau est obligatoire pour un objectif de perte ou de progression.",
    },
  );
