-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "max_groups_created" INTEGER NOT NULL DEFAULT 3,
    "max_memberships" INTEGER NOT NULL DEFAULT 5,
    "max_members_per_group" INTEGER NOT NULL DEFAULT 10,
    "max_tournaments_per_group" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- Seed default plans
INSERT INTO "plans" ("id", "name", "max_groups_created", "max_memberships", "max_members_per_group", "max_tournaments_per_group", "updated_at")
VALUES
  ('00000000-0000-4000-a000-000000000001', 'FREE', 3, 5, 10, 2, NOW()),
  ('00000000-0000-4000-a000-000000000002', 'PREMIUM', 999999, 999999, 50, 999999, NOW());

-- AlterTable
ALTER TABLE "users" ADD COLUMN "plan_id" UUID;

-- Assign FREE plan to all existing users
UPDATE "users" SET "plan_id" = '00000000-0000-4000-a000-000000000001';

-- Make plan_id NOT NULL now that all users have a plan
ALTER TABLE "users" ALTER COLUMN "plan_id" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT '00000000-0000-4000-a000-000000000001';

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
