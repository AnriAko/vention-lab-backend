/*
  Warnings:

  - You are about to drop the column `application` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "application",
ADD COLUMN     "checksum" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "UsersOrganizations" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "UsersOrganizations_organizationId_isDeleted_idx" ON "UsersOrganizations"("organizationId", "isDeleted");
