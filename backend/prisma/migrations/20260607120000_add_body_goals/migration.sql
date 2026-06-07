CREATE TYPE "BodyMetric" AS ENUM (
  'WEIGHT_KG',
  'NECK_CM',
  'CHEST_CM',
  'WAIST_CM',
  'HIPS_CM',
  'ARM_CM',
  'THIGH_CM'
);

CREATE TABLE "BodyGoal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "metric" "BodyMetric" NOT NULL,
  "level" INTEGER NOT NULL,
  "targetValue" DOUBLE PRECISION NOT NULL,
  "deadline" TIMESTAMP(3),
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BodyGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BodyGoal_userId_metric_level_key" ON "BodyGoal"("userId", "metric", "level");
CREATE INDEX "BodyGoal_userId_idx" ON "BodyGoal"("userId");
CREATE INDEX "BodyGoal_metric_idx" ON "BodyGoal"("metric");
CREATE INDEX "BodyGoal_deadline_idx" ON "BodyGoal"("deadline");

ALTER TABLE "BodyGoal"
  ADD CONSTRAINT "BodyGoal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
