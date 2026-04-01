-- AlterTable
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT '00000000-0000-4000-a000-000000000001';

-- CreateIndex
CREATE INDEX "predictions_match_id_idx" ON "predictions"("match_id");
