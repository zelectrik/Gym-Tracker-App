import { prisma } from "../lib/prisma";
import type { upsertWorkoutScheduleSchema } from "../schemas/workoutSchedule.schema";
import type { z } from "zod";

type UpsertWorkoutScheduleInput = z.infer<typeof upsertWorkoutScheduleSchema>;

const includeScheduleDay = {
  template: {
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { position: "asc" as const },
      },
    },
  },
};

function toLocalDateNoon(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

export const getWorkoutSchedule = async (userId: string) => {
  const [config, days] = await Promise.all([
    prisma.workoutScheduleConfig.findUnique({ where: { userId } }),
    prisma.workoutScheduleDay.findMany({
      where: { userId },
      include: includeScheduleDay,
      orderBy: { dayIndex: "asc" },
    }),
  ]);

  return {
    startsAt: config?.startsAt ?? null,
    days,
  };
};

export const upsertWorkoutSchedule = async (
  userId: string,
  data: UpsertWorkoutScheduleInput,
) => {
  const startsAt = data.startsAt ? toLocalDateNoon(data.startsAt) : new Date();
  const normalizedDays = data.days
    .slice()
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map((day, index) => {
      const isRest = day.isRest ?? !day.templateId;
      return {
        userId,
        dayIndex: index + 1,
        templateId: isRest ? null : (day.templateId ?? null),
        isRest,
        label: day.label || undefined,
      };
    });

  await prisma.$transaction([
    prisma.workoutScheduleConfig.upsert({
      where: { userId },
      update: { startsAt },
      create: { userId, startsAt },
    }),
    prisma.workoutScheduleDay.deleteMany({ where: { userId } }),
    prisma.workoutScheduleDay.createMany({ data: normalizedDays }),
  ]);

  return getWorkoutSchedule(userId);
};

export const clearWorkoutSchedule = async (userId: string) => {
  await prisma.$transaction([
    prisma.workoutScheduleDay.deleteMany({ where: { userId } }),
    prisma.workoutScheduleConfig.deleteMany({ where: { userId } }),
  ]);
};
