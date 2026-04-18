-- AlterColumn: matches.scheduled_at TIMESTAMP(3) → TIMESTAMPTZ(3)
-- Existing values are UTC; the USING clause preserves their meaning.
ALTER TABLE "matches" ALTER COLUMN "scheduled_at" TYPE TIMESTAMPTZ(3) USING "scheduled_at" AT TIME ZONE 'UTC';
