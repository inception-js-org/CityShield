/*
  Warnings:

  - Added the required column `updatedAt` to the `PoliceOfficer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PatrolStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "BodycamStatus" AS ENUM ('RECORDING', 'OFFLINE', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "SignalStrength" AS ENUM ('STRONG', 'MEDIUM', 'WEAK', 'NONE');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "FIRStatus" AS ENUM ('DRAFT', 'FILED', 'UNDER_INVESTIGATION', 'CLOSED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('EMERGENCY', 'HOTSPOT', 'SYSTEM', 'FIR', 'PATROL', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('TRANSPORT', 'COMMERCIAL', 'MIXED', 'RESIDENTIAL', 'SLUM', 'INDUSTRIAL');

-- AlterEnum
ALTER TYPE "OfficerStatus" ADD VALUE 'INACTIVE';

-- AlterTable
ALTER TABLE "PoliceOfficer" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coords" JSONB NOT NULL,
    "type" "ZoneType" NOT NULL,
    "popDensity" INTEGER NOT NULL,
    "crowdBase" DOUBLE PRECISION NOT NULL,
    "lighting" DOUBLE PRECISION NOT NULL,
    "cctvDensity" DOUBLE PRECISION NOT NULL,
    "policeScore" DOUBLE PRECISION NOT NULL,
    "patrolFreq" INTEGER NOT NULL,
    "riskBase" DOUBLE PRECISION NOT NULL,
    "crimeRates" JSONB NOT NULL,
    "riskScore" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patrol" (
    "id" TEXT NOT NULL,
    "patrolNumber" TEXT NOT NULL,
    "status" "PatrolStatus" NOT NULL DEFAULT 'ACTIVE',
    "bodycamStatus" "BodycamStatus" NOT NULL DEFAULT 'OFFLINE',
    "signalStrength" "SignalStrength" NOT NULL DEFAULT 'NONE',
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "routeData" JSONB,
    "checkpoints" JSONB,
    "completedCheckpoints" INTEGER NOT NULL DEFAULT 0,
    "totalCheckpoints" INTEGER NOT NULL DEFAULT 0,
    "zoneId" TEXT,
    "leadOfficerId" TEXT,
    "distanceCovered" DOUBLE PRECISION,
    "incidentsReported" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patrol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "complaintNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'LOW',
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "reporterEmail" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "handlerId" TEXT,
    "zoneId" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "linkedFirId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FIR" (
    "id" TEXT NOT NULL,
    "firNumber" TEXT NOT NULL,
    "status" "FIRStatus" NOT NULL DEFAULT 'DRAFT',
    "incidentType" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "witnesses" JSONB,
    "complainantName" TEXT NOT NULL,
    "complainantPhone" TEXT,
    "complainantEmail" TEXT,
    "complainantAddress" TEXT,
    "accusedName" TEXT,
    "accusedDescription" TEXT,
    "registeredById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "zoneId" TEXT,
    "patrolId" TEXT,
    "investigationNotes" TEXT,
    "closureReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FIR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "zoneId" TEXT,
    "patrolId" TEXT,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PatrolOfficers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_zoneId_key" ON "Zone"("zoneId");

-- CreateIndex
CREATE INDEX "Zone_type_idx" ON "Zone"("type");

-- CreateIndex
CREATE INDEX "Zone_riskBase_idx" ON "Zone"("riskBase");

-- CreateIndex
CREATE UNIQUE INDEX "Patrol_patrolNumber_key" ON "Patrol"("patrolNumber");

-- CreateIndex
CREATE INDEX "Patrol_status_idx" ON "Patrol"("status");

-- CreateIndex
CREATE INDEX "Patrol_bodycamStatus_idx" ON "Patrol"("bodycamStatus");

-- CreateIndex
CREATE INDEX "Patrol_zoneId_idx" ON "Patrol"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_complaintNumber_key" ON "Complaint"("complaintNumber");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_type_idx" ON "Complaint"("type");

-- CreateIndex
CREATE INDEX "Complaint_zoneId_idx" ON "Complaint"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "FIR_firNumber_key" ON "FIR"("firNumber");

-- CreateIndex
CREATE INDEX "FIR_status_idx" ON "FIR"("status");

-- CreateIndex
CREATE INDEX "FIR_incidentType_idx" ON "FIR"("incidentType");

-- CreateIndex
CREATE INDEX "FIR_zoneId_idx" ON "FIR"("zoneId");

-- CreateIndex
CREATE INDEX "FIR_registeredById_idx" ON "FIR"("registeredById");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_acknowledged_idx" ON "Alert"("acknowledged");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_PatrolOfficers_AB_unique" ON "_PatrolOfficers"("A", "B");

-- CreateIndex
CREATE INDEX "_PatrolOfficers_B_index" ON "_PatrolOfficers"("B");

-- AddForeignKey
ALTER TABLE "Patrol" ADD CONSTRAINT "Patrol_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patrol" ADD CONSTRAINT "Patrol_leadOfficerId_fkey" FOREIGN KEY ("leadOfficerId") REFERENCES "PoliceOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES "PoliceOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_linkedFirId_fkey" FOREIGN KEY ("linkedFirId") REFERENCES "FIR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIR" ADD CONSTRAINT "FIR_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "PoliceOfficer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIR" ADD CONSTRAINT "FIR_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "PoliceOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIR" ADD CONSTRAINT "FIR_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIR" ADD CONSTRAINT "FIR_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "PoliceOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatrolOfficers" ADD CONSTRAINT "_PatrolOfficers_A_fkey" FOREIGN KEY ("A") REFERENCES "Patrol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatrolOfficers" ADD CONSTRAINT "_PatrolOfficers_B_fkey" FOREIGN KEY ("B") REFERENCES "PoliceOfficer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
