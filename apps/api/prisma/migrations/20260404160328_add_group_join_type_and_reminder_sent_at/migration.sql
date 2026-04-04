-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_JOIN';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "reminder_sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT '00000000-0000-4000-a000-000000000001';
