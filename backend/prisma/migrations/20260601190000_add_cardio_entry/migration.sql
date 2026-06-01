CREATE TABLE "CardioEntry" (
  "id" TEXT NOT NULL,
  "sessionExerciseId" TEXT NOT NULL,
  "durationSec" INTEGER,
  "distanceKm" DOUBLE PRECISION,
  "calories" INTEGER,
  "speedKmh" DOUBLE PRECISION,
  "inclinePercent" DOUBLE PRECISION,
  "avgHeartRate" INTEGER,
  "maxHeartRate" INTEGER,
  "watts" INTEGER,
  "rpm" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CardioEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CardioEntry_sessionExerciseId_key" ON "CardioEntry"("sessionExerciseId");

ALTER TABLE "CardioEntry"
  ADD CONSTRAINT "CardioEntry_sessionExerciseId_fkey"
  FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
