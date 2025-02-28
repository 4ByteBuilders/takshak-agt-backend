/*
  Warnings:

  - You are about to drop the `QrToBookingId` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `qrCode` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "qrCode" TEXT NOT NULL;

-- DropTable
DROP TABLE "QrToBookingId";
