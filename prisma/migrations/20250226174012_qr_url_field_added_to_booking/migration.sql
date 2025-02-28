/*
  Warnings:

  - You are about to drop the column `qrToken` on the `Booking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[qrUrl]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qrUrl` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Booking_qrToken_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "qrToken",
ADD COLUMN     "qrUrl" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_qrUrl_key" ON "Booking"("qrUrl");
