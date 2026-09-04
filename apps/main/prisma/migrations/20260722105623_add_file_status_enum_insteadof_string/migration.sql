/*
  Warnings:

  - The `status` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PROCESSED', 'PROCESSING', 'ERROR');

-- AlterTable
ALTER TABLE "File" DROP COLUMN "status",
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'PROCESSED';
