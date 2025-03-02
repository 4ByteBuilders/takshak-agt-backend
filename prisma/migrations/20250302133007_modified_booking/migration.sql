/*
  Warnings:

  - Added the required column `eventId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceOfferingSelected` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "priceOfferingSelected" JSONB NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
