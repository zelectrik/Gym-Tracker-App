/*
  Warnings:

  - The values [LEGS,OTHER] on the enum `MuscleGroup` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[sessionExerciseId,setNumber,side]` on the table `ExerciseSet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ExerciseSide" AS ENUM ('BOTH', 'LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "ExerciseTrackingType" AS ENUM ('STRENGTH', 'CARDIO');

-- AlterEnum
BEGIN;
CREATE TYPE "MuscleGroup_new" AS ENUM ('CHEST', 'UPPER_CHEST', 'BACK', 'LATS', 'TRAPS', 'SHOULDERS', 'FRONT_SHOULDERS', 'REAR_SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'OBLIQUES', 'LOWER_BACK', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ADDUCTORS', 'ABDUCTORS', 'CARDIO', 'CORE', 'FULL_BODY');
ALTER TABLE "Exercise" ALTER COLUMN "muscleGroup" TYPE "MuscleGroup_new" USING ("muscleGroup"::text::"MuscleGroup_new");
ALTER TYPE "MuscleGroup" RENAME TO "MuscleGroup_old";
ALTER TYPE "MuscleGroup_new" RENAME TO "MuscleGroup";
DROP TYPE "public"."MuscleGroup_old";
COMMIT;

-- DropIndex
DROP INDEX "ExerciseSet_sessionExerciseId_setNumber_key";

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "muscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "trackingType" "ExerciseTrackingType" NOT NULL DEFAULT 'STRENGTH',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'machine';

-- AlterTable
ALTER TABLE "ExerciseSet" ADD COLUMN     "side" "ExerciseSide" NOT NULL DEFAULT 'BOTH';

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "targetDurationSec" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSet_sessionExerciseId_setNumber_side_key" ON "ExerciseSet"("sessionExerciseId", "setNumber", "side");
