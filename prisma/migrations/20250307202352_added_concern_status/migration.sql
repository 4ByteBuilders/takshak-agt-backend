-- CreateEnum
CREATE TYPE "ConcernStatus" AS ENUM ('RESOLVED', 'UNRESOLVED');

-- AlterTable
ALTER TABLE "Concern" ADD COLUMN     "status" "ConcernStatus" NOT NULL DEFAULT 'UNRESOLVED';
