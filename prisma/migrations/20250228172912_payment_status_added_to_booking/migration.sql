/*
  Warnings:

  - You are about to drop the column `bookedAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `qrUrl` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `paymentStatus` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- DropIndex
DROP INDEX "Booking_qrUrl_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "bookedAt",
DROP COLUMN "qrUrl",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numVerifiedAtVenue" INTEGER,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL;
