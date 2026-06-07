import { z } from "zod";

const optionalPositiveNumber = z.number().positive().optional();

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
