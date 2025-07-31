-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "players" INTEGER NOT NULL DEFAULT 0,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "score1" INTEGER NOT NULL,
    "score2" INTEGER NOT NULL,
    "winnerId" INTEGER NOT NULL,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lasted" INTEGER NOT NULL DEFAULT 0,
    "pointsUp" INTEGER NOT NULL DEFAULT 0,
    "pointsDown" INTEGER NOT NULL DEFAULT 0,
    "tournament_mode" BOOLEAN NOT NULL DEFAULT false,
    "ia_mode" BOOLEAN NOT NULL DEFAULT false,
    "multi_mode" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("id", "lasted", "playedAt", "player1Id", "player2Id", "players", "pointsDown", "pointsUp", "score1", "score2", "winnerId") SELECT "id", "lasted", "playedAt", "player1Id", "player2Id", "players", "pointsDown", "pointsUp", "score1", "score2", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
