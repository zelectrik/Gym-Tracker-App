-- Planned workout execution MVP
CREATE TYPE "ExecutionMode" AS ENUM ('BILATERAL', 'LEFT_RIGHT');

ALTER TABLE "TemplateExercise"
  ADD COLUMN "executionMode" "ExecutionMode" NOT NULL DEFAULT 'BILATERAL',
  ADD COLUMN "targetWeightKg" DOUBLE PRECISION,
  ADD COLUMN "leftWeightKg" DOUBLE PRECISION,
  ADD COLUMN "rightWeightKg" DOUBLE PRECISION;

ALTER TABLE "SessionExercise"
  ADD COLUMN "targetSets" INTEGER,
  ADD COLUMN "targetReps" INTEGER,
  ADD COLUMN "restSeconds" INTEGER,
  ADD COLUMN "executionMode" "ExecutionMode" NOT NULL DEFAULT 'BILATERAL',
  ADD COLUMN "targetWeightKg" DOUBLE PRECISION,
  ADD COLUMN "leftWeightKg" DOUBLE PRECISION,
  ADD COLUMN "rightWeightKg" DOUBLE PRECISION;
