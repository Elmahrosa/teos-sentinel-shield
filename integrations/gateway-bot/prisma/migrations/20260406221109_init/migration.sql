-- CreateTable
CREATE TABLE "Activation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramUserId" TEXT NOT NULL,
    "telegramHandle" TEXT,
    "tier" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "payerWallet" TEXT,
    "amountSol" REAL NOT NULL,
    "receiverWallet" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "licenseKey" TEXT,
    "apiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activationId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "License_activationId_fkey" FOREIGN KEY ("activationId") REFERENCES "Activation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Activation_txHash_key" ON "Activation"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "License_activationId_key" ON "License"("activationId");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKey_key" ON "License"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "License_apiKey_key" ON "License"("apiKey");
