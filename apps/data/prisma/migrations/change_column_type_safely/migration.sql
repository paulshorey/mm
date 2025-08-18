-- Safe migration: Convert interval column from INTEGER to TEXT while preserving data
-- This migration handles the type conversion without data loss

-- Step 1: Add a temporary string column
ALTER TABLE "fractal_v1" ADD COLUMN "interval_temp" TEXT;

-- Step 2: Convert existing integer values to strings (preserving all existing data)
UPDATE "fractal_v1" SET "interval_temp" = CAST("interval" AS TEXT);

-- Step 3: Drop the old integer column
ALTER TABLE "fractal_v1" DROP COLUMN "interval";

-- Step 4: Rename the temporary column to the original name
ALTER TABLE "fractal_v1" RENAME COLUMN "interval_temp" TO "interval";

-- Step 5: Add NOT NULL constraint to match the schema
ALTER TABLE "fractal_v1" ALTER COLUMN "interval" SET NOT NULL;