CREATE TABLE IF NOT EXISTS "WorkoutScheduleConfig" (
  "userId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkoutScheduleConfig_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "WorkoutScheduleDay" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayIndex" INTEGER NOT NULL,
  "templateId" TEXT,
  "isRest" BOOLEAN NOT NULL DEFAULT false,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkoutScheduleDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkoutScheduleDay_userId_dayIndex_key"
ON "WorkoutScheduleDay"("userId", "dayIndex");

CREATE INDEX IF NOT EXISTS "WorkoutScheduleDay_userId_idx"
ON "WorkoutScheduleDay"("userId");

CREATE INDEX IF NOT EXISTS "WorkoutScheduleDay_templateId_idx"
ON "WorkoutScheduleDay"("templateId");

ALTER TABLE "WorkoutScheduleConfig"
  ADD CONSTRAINT "WorkoutScheduleConfig_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutScheduleDay"
  ADD CONSTRAINT "WorkoutScheduleDay_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutScheduleDay"
  ADD CONSTRAINT "WorkoutScheduleDay_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
