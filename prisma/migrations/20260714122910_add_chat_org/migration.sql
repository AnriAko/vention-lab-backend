/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `User` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "organization_search_vector_idx";

-- DropIndex
DROP INDEX "user_search_vector_idx";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "search_vector";

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
