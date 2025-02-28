-- CreateTable
CREATE TABLE "QrToBookingId" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "QrToBookingId_pkey" PRIMARY KEY ("id")
);
