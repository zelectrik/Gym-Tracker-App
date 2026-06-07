import { prisma } from "../lib/prisma";
import type { createBodySnapshotSchema } from "../schemas/body.schema";
import type { z } from "zod";

type CreateBodySnapshotInput = z.infer<typeof createBodySnapshotSchema>;

function toMeasurementDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
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
