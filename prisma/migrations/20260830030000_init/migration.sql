CREATE TYPE "Language" AS ENUM ('RU', 'EN');
CREATE TYPE "UnitSystem" AS ENUM ('METRIC', 'IMPERIAL');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeatherPanel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'E-Ink Weather',
    "slug" TEXT NOT NULL,
    "cityName" TEXT NOT NULL DEFAULT 'Махачкала',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 42.9849,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 47.5047,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "language" "Language" NOT NULL DEFAULT 'RU',
    "unitSystem" "UnitSystem" NOT NULL DEFAULT 'METRIC',
    "refreshMinutes" INTEGER NOT NULL DEFAULT 10,
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WeatherPanel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "WeatherPanel_slug_key" ON "WeatherPanel"("slug");
CREATE INDEX "WeatherPanel_userId_idx" ON "WeatherPanel"("userId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeatherPanel" ADD CONSTRAINT "WeatherPanel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
