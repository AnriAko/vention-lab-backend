/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `UsersOrganizations` table. All the data in the column will be lost.
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

-- AlterTable
ALTER TABLE "UsersOrganizations" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "Owner" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UsersOrganizationsRoles" (
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "UsersOrganizationsRoles_pkey" PRIMARY KEY ("userId","organizationId")
);

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOrganizationsRoles" ADD CONSTRAINT "UsersOrganizationsRoles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOrganizationsRoles" ADD CONSTRAINT "UsersOrganizationsRoles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
