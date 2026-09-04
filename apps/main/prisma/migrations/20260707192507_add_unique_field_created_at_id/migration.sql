/*
  Warnings:

  - A unique constraint covering the columns `[createdAt,id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_createdAt_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "User_createdAt_id_key" ON "User"("createdAt", "id");
