/*
  Warnings:

  - You are about to drop the column `ticketIds` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `ticketIds` on the `Event` table. All the data in the column will be lost.
  - Added the required column `capacity` to the `PriceOffering` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "ticketIds";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "ticketIds";

-- AlterTable
ALTER TABLE "PriceOffering" ADD COLUMN     "capacity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "eventId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
