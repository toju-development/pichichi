-- Remove INSTAGRAM from AuthProvider enum
-- Safety: delete any users with INSTAGRAM provider before altering type
DELETE FROM "users" WHERE "auth_provider" = 'INSTAGRAM';

-- Postgres doesn't support ALTER TYPE ... DROP VALUE, so we must:
-- 1. Rename old enum
-- 2. Create new enum without INSTAGRAM
-- 3. Alter column to use new enum
-- 4. Drop old enum
ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'APPLE');
ALTER TABLE "users" ALTER COLUMN "auth_provider"
  TYPE "AuthProvider" USING "auth_provider"::text::"AuthProvider";
DROP TYPE "AuthProvider_old";
