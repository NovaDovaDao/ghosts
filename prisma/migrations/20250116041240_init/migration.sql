-- CreateEnum
CREATE TYPE "Sender" AS ENUM ('user', 'agent');

-- CreateTable
CREATE TABLE "Message" (
    "userId" STRING NOT NULL,
    "agentId" STRING,
    "messageId" STRING NOT NULL,
    "content" STRING NOT NULL,
    "sender" "Sender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageId_key" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "Message_userId_messageId_idx" ON "Message"("userId", "messageId");
