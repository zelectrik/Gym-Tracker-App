CREATE TYPE "MealType" AS ENUM (
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK',
  'OTHER'
);

CREATE TABLE "NutritionEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "mealType" "MealType" NOT NULL DEFAULT 'OTHER',
  "description" TEXT NOT NULL,
  "calories" DOUBLE PRECISION NOT NULL,
  "proteinG" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "carbsG" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NutritionEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NutritionEntry_userId_idx" ON "NutritionEntry"("userId");
CREATE INDEX "NutritionEntry_date_idx" ON "NutritionEntry"("date");
CREATE INDEX "NutritionEntry_mealType_idx" ON "NutritionEntry"("mealType");

ALTER TABLE "NutritionEntry"
  ADD CONSTRAINT "NutritionEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
