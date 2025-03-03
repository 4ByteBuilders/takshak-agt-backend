-- CreateEnum
CREATE TYPE "Status" AS ENUM ('AVAILABLE', 'BOOKED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "totalNumberOfTickets" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrls" JSONB NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceOffering" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "PriceOffering_pkey" PRIMARY KEY ("id","eventId")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT,
    "status" "Status" NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "priceOfferingSelected" JSONB NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "paymentSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numVerifiedAtVenue" INTEGER,
    "qrCode" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_qrCode_key" ON "Booking"("qrCode");

-- AddForeignKey
ALTER TABLE "PriceOffering" ADD CONSTRAINT "PriceOffering_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
