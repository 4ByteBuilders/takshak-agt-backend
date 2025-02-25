-- CreateEnum
CREATE TYPE "Status" AS ENUM ('AVAILABLE', 'BOOKED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ticketIds" TEXT[],
    "venue" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "totalNumberOfTickets" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrls" TEXT[],

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceOffering" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PriceOffering_pkey" PRIMARY KEY ("id","eventId")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "status" "Status" NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketIds" TEXT[],
    "amountPaid" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceOffering" ADD CONSTRAINT "PriceOffering_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
