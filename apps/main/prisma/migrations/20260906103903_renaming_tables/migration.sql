/*
  Warnings:

  - You are about to drop the `AiMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AiConversationMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AiConversationMessageStatus" AS ENUM ('SUCCESS', 'CANCELLED', 'FAILED');

-- DropForeignKey
ALTER TABLE "AiMessage" DROP CONSTRAINT "AiMessage_conversationId_fkey";

-- DropTable
DROP TABLE "AiMessage";

-- DropEnum
DROP TYPE "AiMessageRole";

-- CreateTable
CREATE TABLE "AiConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiConversationMessageRole" NOT NULL,
    "status" "AiConversationMessageStatus",
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiConversationMessage_conversationId_createdAt_idx" ON "AiConversationMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiConversationMessage" ADD CONSTRAINT "AiConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
