-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'READ');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'UNREAD';

-- CreateTable
CREATE TABLE "Verifier" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Verifier_pkey" PRIMARY KEY ("id")
);
