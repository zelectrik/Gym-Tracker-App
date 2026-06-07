import { prisma } from "../lib/prisma";
import type { createBodyGoalSchema, createBodySnapshotSchema } from "../schemas/body.schema";
import type { z } from "zod";

type CreateBodySnapshotInput = z.infer<typeof createBodySnapshotSchema>;
type CreateBodyGoalInput = z.infer<typeof createBodyGoalSchema>;

function toMeasurementDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function toOptionalDeadline(value?: string) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

function isMaintainGoal(goalType: CreateBodyGoalInput["goalType"]) {
  return goalType === "MAINTAIN_ABOVE" || goalType === "MAINTAIN_BELOW";
}

export const listBodySnapshots = async (userId: string) => {
  return prisma.bodySnapshot.findMany({
    where: { userId },
    orderBy: { measuredAt: "desc" },
  });
};

export const upsertBodySnapshot = async (
  userId: string,
  data: CreateBodySnapshotInput,
) => {
  const measuredAt = toMeasurementDate(data.measuredAt);

  return prisma.bodySnapshot.upsert({
    where: {
      userId_measuredAt: {
        userId,
        measuredAt,
      },
    },
    update: {
      weightKg: data.weightKg,
      neckCm: data.neckCm,
      chestCm: data.chestCm,
      waistCm: data.waistCm,
      hipsCm: data.hipsCm,
      armCm: data.armCm,
      thighCm: data.thighCm,
      notes: data.notes,
    },
    create: {
      userId,
      measuredAt,
      weightKg: data.weightKg,
      neckCm: data.neckCm,
      chestCm: data.chestCm,
      waistCm: data.waistCm,
      hipsCm: data.hipsCm,
      armCm: data.armCm,
      thighCm: data.thighCm,
      notes: data.notes,
    },
  });
};

export const listBodyGoals = async (userId: string) => {
  return prisma.bodyGoal.findMany({
    where: { userId, isActive: true },
    orderBy: [{ metric: "asc" }, { level: "asc" }],
  });
};

export const upsertBodyGoal = async (userId: string, data: CreateBodyGoalInput) => {
  const maintain = isMaintainGoal(data.goalType);
  const level = maintain ? 0 : data.level;

  return prisma.bodyGoal.upsert({
    where: {
      userId_metric_level: {
        userId,
        metric: data.metric,
        level,
      },
    },
    update: {
      goalType: data.goalType,
      targetValue: data.targetValue,
      tolerance: data.tolerance,
      deadline: maintain ? null : toOptionalDeadline(data.deadline),
      notes: data.notes,
      isActive: data.isActive ?? true,
    },
    create: {
      userId,
      metric: data.metric,
      goalType: data.goalType,
      level,
      targetValue: data.targetValue,
      tolerance: data.tolerance,
      deadline: maintain ? null : toOptionalDeadline(data.deadline),
      notes: data.notes,
      isActive: data.isActive ?? true,
    },
  });
};

export const deleteBodyGoal = async (userId: string, goalId: string) => {
  const result = await prisma.bodyGoal.deleteMany({
    where: {
      id: goalId,
      userId,
    },
  });

  return result.count > 0;
};
