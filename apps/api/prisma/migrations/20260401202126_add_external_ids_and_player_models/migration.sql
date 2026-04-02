-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "external_id" INTEGER;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "external_id" INTEGER,
ADD COLUMN     "logo_url" VARCHAR(500);

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "external_league_id" INTEGER,
ADD COLUMN     "external_season" INTEGER;

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "external_id" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "photo_url" VARCHAR(500),
    "position" VARCHAR(50),
    "nationality" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_players" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "shirt_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_external_id_key" ON "players"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_players_tournament_id_player_id_key" ON "tournament_players"("tournament_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_external_id_key" ON "matches"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_external_id_key" ON "teams"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_external_league_id_external_season_key" ON "tournaments"("external_league_id", "external_season");

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
