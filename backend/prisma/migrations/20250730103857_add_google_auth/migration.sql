-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorCode" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorEnabledAt" DATETIME,
    "twoFactorCodeExpires" DATETIME,
    "twoFactorType" TEXT,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarUrl", "connected", "createdAt", "email", "gamesPlayed", "id", "isTwoFactorEnabled", "losses", "passwordHash", "twoFactorCode", "twoFactorCodeExpires", "twoFactorEnabledAt", "twoFactorSecret", "twoFactorType", "username", "wins") SELECT "avatarUrl", "connected", "createdAt", "email", "gamesPlayed", "id", "isTwoFactorEnabled", "losses", "passwordHash", "twoFactorCode", "twoFactorCodeExpires", "twoFactorEnabledAt", "twoFactorSecret", "twoFactorType", "username", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
