-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'INSTAGRAM', 'APPLE');

-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'UPCOMING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TournamentType" AS ENUM ('WORLD_CUP', 'COPA_AMERICA', 'EURO', 'CHAMPIONS_LEAGUE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MatchPhase" AS ENUM ('GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PredictionPointType" AS ENUM ('EXACT', 'GOAL_DIFF', 'WINNER', 'MISS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH_REMINDER', 'MATCH_RESULT', 'PREDICTION_DEADLINE', 'GROUP_INVITE', 'LEADERBOARD_CHANGE', 'BONUS_REMINDER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "avatar_url" VARCHAR(500),
    "auth_provider" "AuthProvider" NOT NULL,
    "auth_provider_id" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(500),
    "fcm_token" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "type" "TournamentType" NOT NULL,
    "description" VARCHAR(500),
    "logo_url" VARCHAR(500),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_phases" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "phase" "MatchPhase" NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "tournament_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "short_name" VARCHAR(5) NOT NULL,
    "flag_url" VARCHAR(500),
    "country" VARCHAR(100),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "group_letter" VARCHAR(2),
    "is_eliminated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "home_team_id" UUID,
    "away_team_id" UUID,
    "phase" "MatchPhase" NOT NULL,
    "group_letter" VARCHAR(2),
    "match_number" INTEGER,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "venue" VARCHAR(200),
    "city" VARCHAR(100),
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "home_score" INTEGER,
    "away_score" INTEGER,
    "home_score_penalties" INTEGER,
    "away_score_penalties" INTEGER,
    "is_extra_time" BOOLEAN NOT NULL DEFAULT false,
    "home_team_placeholder" VARCHAR(50),
    "away_team_placeholder" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "invite_code" VARCHAR(8) NOT NULL,
    "created_by" UUID NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_tournaments" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,

    CONSTRAINT "group_tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "predicted_home" INTEGER NOT NULL,
    "predicted_away" INTEGER NOT NULL,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "point_type" "PredictionPointType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_bonus_types" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "tournament_bonus_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_predictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "bonus_type_id" UUID NOT NULL,
    "predicted_value" VARCHAR(200) NOT NULL,
    "is_correct" BOOLEAN,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_auth_provider_id_key" ON "users"("auth_provider", "auth_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_phases_tournament_id_phase_key" ON "tournament_phases"("tournament_id", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_teams_tournament_id_team_id_key" ON "tournament_teams"("tournament_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_invite_code_key" ON "groups"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_tournaments_group_id_tournament_id_key" ON "group_tournaments"("group_id", "tournament_id");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_user_id_match_id_group_id_key" ON "predictions"("user_id", "match_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_bonus_types_tournament_id_key_key" ON "tournament_bonus_types"("tournament_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "bonus_predictions_user_id_group_id_bonus_type_id_key" ON "bonus_predictions"("user_id", "group_id", "bonus_type_id");

-- AddForeignKey
ALTER TABLE "tournament_phases" ADD CONSTRAINT "tournament_phases_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_tournaments" ADD CONSTRAINT "group_tournaments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_tournaments" ADD CONSTRAINT "group_tournaments_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_bonus_types" ADD CONSTRAINT "tournament_bonus_types_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_predictions" ADD CONSTRAINT "bonus_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_predictions" ADD CONSTRAINT "bonus_predictions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_predictions" ADD CONSTRAINT "bonus_predictions_bonus_type_id_fkey" FOREIGN KEY ("bonus_type_id") REFERENCES "tournament_bonus_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
