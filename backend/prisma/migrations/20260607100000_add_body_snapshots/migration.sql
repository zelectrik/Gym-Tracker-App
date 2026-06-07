CREATE TABLE "BodySnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "measuredAt" TIMESTAMP(3) NOT NULL,
  "weightKg" DOUBLE PRECISION,
  "neckCm" DOUBLE PRECISION,
  "chestCm" DOUBLE PRECISION,
  "waistCm" DOUBLE PRECISION,
  "hipsCm" DOUBLE PRECISION,
  "armCm" DOUBLE PRECISION,
  "thighCm" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BodySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BodySnapshot_userId_measuredAt_key" ON "BodySnapshot"("userId", "measuredAt");
CREATE INDEX "BodySnapshot_userId_idx" ON "BodySnapshot"("userId");
CREATE INDEX "BodySnapshot_measuredAt_idx" ON "BodySnapshot"("measuredAt");

ALTER TABLE "BodySnapshot"
  ADD CONSTRAINT "BodySnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
