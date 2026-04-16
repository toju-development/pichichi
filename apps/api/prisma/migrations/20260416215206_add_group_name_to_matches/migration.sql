/*
  Warnings:

  - You are about to drop the column `group_letter` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `group_letter` on the `tournament_teams` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "group_letter",
ADD COLUMN     "group_name" VARCHAR(50);

-- AlterTable
ALTER TABLE "tournament_teams" DROP COLUMN "group_letter",
ADD COLUMN     "group_name" VARCHAR(50);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT '00000000-0000-4000-a000-000000000001';
