-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'RESERVED';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "reservationExpiresAt" TIMESTAMP(3);
