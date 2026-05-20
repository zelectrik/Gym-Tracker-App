CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'USER');
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'ABS', 'CARDIO', 'FULL_BODY', 'OTHER');
CREATE TYPE "WorkoutStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Exercise" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "muscleGroup" "MuscleGroup" NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

CREATE TABLE "WorkoutTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkoutTemplate_ownerId_idx" ON "WorkoutTemplate"("ownerId");

CREATE TABLE "TemplateExercise" (
  "id" TEXT NOT NULL,
  "workoutTemplateId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "targetSets" INTEGER NOT NULL,
  "targetReps" INTEGER,
  "targetDurationSec" INTEGER,
  "restSeconds" INTEGER,
  "notes" TEXT,
  CONSTRAINT "TemplateExercise_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TemplateExercise_workoutTemplateId_position_key" ON "TemplateExercise"("workoutTemplateId", "position");
CREATE INDEX "TemplateExercise_exerciseId_idx" ON "TemplateExercise"("exerciseId");

CREATE TABLE "WorkoutSession" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "WorkoutStatus" NOT NULL DEFAULT 'PLANNED',
  "scheduledAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "templateId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkoutSession_status_idx" ON "WorkoutSession"("status");
CREATE INDEX "WorkoutSession_scheduledAt_idx" ON "WorkoutSession"("scheduledAt");

CREATE TABLE "WorkoutParticipant" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "WorkoutParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkoutParticipant_sessionId_userId_key" ON "WorkoutParticipant"("sessionId", "userId");
CREATE INDEX "WorkoutParticipant_userId_idx" ON "WorkoutParticipant"("userId");

CREATE TABLE "SessionExercise" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "notes" TEXT,
  CONSTRAINT "SessionExercise_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SessionExercise_sessionId_position_key" ON "SessionExercise"("sessionId", "position");
CREATE INDEX "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");

CREATE TABLE "ExerciseSet" (
  "id" TEXT NOT NULL,
  "sessionExerciseId" TEXT NOT NULL,
  "setNumber" INTEGER NOT NULL,
  "reps" INTEGER,
  "weightKg" DOUBLE PRECISION,
  "durationSec" INTEGER,
  "distanceMeters" INTEGER,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExerciseSet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExerciseSet_sessionExerciseId_setNumber_key" ON "ExerciseSet"("sessionExerciseId", "setNumber");

ALTER TABLE "WorkoutTemplate" ADD CONSTRAINT "WorkoutTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkoutParticipant" ADD CONSTRAINT "WorkoutParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutParticipant" ADD CONSTRAINT "WorkoutParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
