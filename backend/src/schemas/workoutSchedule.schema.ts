import { z } from "zod";

export const workoutScheduleDaySchema = z.object({
  dayIndex: z.number().int().min(1).max(31),
  templateId: z.string().uuid().nullable().optional(),
  isRest: z.boolean().optional(),
  label: z.string().trim().max(80).optional(),
});

export const upsertWorkoutScheduleSchema = z.object({
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format YYYY-MM-DD").optional(),
  days: z.array(workoutScheduleDaySchema).min(1).max(31),
});
