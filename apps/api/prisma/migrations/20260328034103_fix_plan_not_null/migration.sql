-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_plan_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT '00000000-0000-4000-a000-000000000001';

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
