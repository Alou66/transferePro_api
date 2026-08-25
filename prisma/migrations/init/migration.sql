-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED', 'REFUSED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('CREATED', 'READY_FOR_PAYMENT', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "cityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL,
    "withdrawalCode" VARCHAR(4) NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'CREATED',
    "originCityId" TEXT NOT NULL,
    "destinationCityId" TEXT NOT NULL,
    "originAgentId" TEXT NOT NULL,
    "destinationAgentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_collections" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_cityId_idx" ON "users"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE INDEX "cities_name_idx" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_reference_key" ON "transfers"("reference");

-- CreateIndex
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

-- CreateIndex
CREATE INDEX "transfers_createdAt_idx" ON "transfers"("createdAt");

-- CreateIndex
CREATE INDEX "transfers_originCityId_idx" ON "transfers"("originCityId");

-- CreateIndex
CREATE INDEX "transfers_destinationCityId_idx" ON "transfers"("destinationCityId");

-- CreateIndex
CREATE INDEX "transfers_originAgentId_idx" ON "transfers"("originAgentId");

-- CreateIndex
CREATE INDEX "transfers_destinationAgentId_idx" ON "transfers"("destinationAgentId");

-- CreateIndex
CREATE INDEX "transfers_reference_idx" ON "transfers"("reference");

-- CreateIndex
CREATE INDEX "cash_collections_agentId_idx" ON "cash_collections"("agentId");

-- CreateIndex
CREATE INDEX "cash_collections_collectedAt_idx" ON "cash_collections"("collectedAt");

-- CreateIndex
CREATE INDEX "cash_collections_createdBy_idx" ON "cash_collections"("createdBy");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_originCityId_fkey" FOREIGN KEY ("originCityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_destinationCityId_fkey" FOREIGN KEY ("destinationCityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_originAgentId_fkey" FOREIGN KEY ("originAgentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_destinationAgentId_fkey" FOREIGN KEY ("destinationAgentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

