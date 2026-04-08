-- CreateTable
CREATE TABLE "Activation" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "activationId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'activated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShieldedUrl" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShieldedUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activation_txHash_key" ON "Activation"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "License_activationId_key" ON "License"("activationId");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKey_key" ON "License"("licenseKey");

-- CreateIndex
CREATE INDEX "ShieldedUrl_userId_idx" ON "ShieldedUrl"("userId");

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_activationId_fkey" FOREIGN KEY ("activationId") REFERENCES "Activation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
