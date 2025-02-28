/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qrToken` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "qrToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_qrToken_key" ON "Booking"("qrToken");
