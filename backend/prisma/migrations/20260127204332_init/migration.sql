-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OFFICER');

-- CreateEnum
CREATE TYPE "OfficerStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "PoliceOfficer" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "rank" TEXT,
    "badge" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OFFICER',
    "status" "OfficerStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoliceOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoliceOfficer_clerkUserId_key" ON "PoliceOfficer"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceOfficer_email_key" ON "PoliceOfficer"("email");

-- CreateIndex
CREATE INDEX "PoliceOfficer_status_idx" ON "PoliceOfficer"("status");

-- CreateIndex
CREATE INDEX "PoliceOfficer_role_idx" ON "PoliceOfficer"("role");
