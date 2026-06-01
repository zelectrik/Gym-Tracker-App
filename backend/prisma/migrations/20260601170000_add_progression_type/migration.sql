CREATE TYPE "ProgressionType" AS ENUM ('WEIGHT', 'ASSISTED_WEIGHT', 'DURATION');

ALTER TABLE "Exercise"
  ADD COLUMN "progressionType" "ProgressionType" NOT NULL DEFAULT 'WEIGHT';

UPDATE "Exercise"
SET "progressionType" = 'ASSISTED_WEIGHT'
WHERE LOWER("name") LIKE '%assist%';

UPDATE "Exercise"
SET "progressionType" = 'DURATION'
WHERE LOWER("name") LIKE '%gainage%'
   OR "type" = 'cardio';
