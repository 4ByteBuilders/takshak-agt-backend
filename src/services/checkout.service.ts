import { Status, PaymentStatus, PrismaClient } from "@prisma/client";
import prisma from "../utils/prisma";
import { v4 as uuidv4 } from "uuid";
import BookingService from "./booking.service";
import { CustomError } from "../utils/CustomError";

const RESERVATION_TIMEOUT_MS = 16 * 60 * 1000;

interface OrderRequest {
  eventId: string;
  user: { id: string };
  ticketCounts: number;
  totalAmount: number;
  priceOfferings: any;
}

class CheckoutService {
  static async getOrderReady({
    eventId,
    user,
    ticketCounts,
    totalAmount,
    priceOfferings,
  }: OrderRequest) {
    return await prisma.$transaction(
      async (tx) => {
        // Step 1: Remove expired reservations
        // await tx.ticket.updateMany({
        //   where: {
        //     eventId,
        //     status: Status.RESERVED,
        //     reservationExpiresAt: { lt: new Date() },
        //   },
        //   data: { status: Status.AVAILABLE, reservationExpiresAt: null },
        // });

        // Step 2: Select available tickets with row-level locking
        const availableTickets = await tx.$queryRaw<{ id: string }[]>`
          SELECT id 
          FROM "Ticket"
          WHERE "eventId" = ${eventId} AND "status" = 'AVAILABLE'
          FOR UPDATE SKIP LOCKED
          LIMIT ${ticketCounts};
        `;

        if (availableTickets.length < ticketCounts) {
          throw new CustomError("Not enough available tickets", 400);
        }

        const ticketIds = availableTickets.map((ticket) => ticket.id);

        const ticketsExpiryTime = new Date(Date.now() + RESERVATION_TIMEOUT_MS);

        // Step 3: Reserve the tickets
        await tx.ticket.updateMany({
          where: { id: { in: ticketIds } },
          data: {
            status: Status.RESERVED,
            reservationExpiresAt: ticketsExpiryTime,
          },
        });

        // Step 4: Create a booking with a PENDING payment
        const booking = await tx.booking.create({
          data: {
            userId: user.id,
            tickets: {
              connect: ticketIds.map((id) => ({ id })),
            },
            amountPaid: totalAmount,
            eventId,
            priceOfferingSelected: JSON.stringify(priceOfferings),
            paymentStatus: PaymentStatus.PENDING,
            numVerifiedAtVenue: 0,
            qrCode: uuidv4().slice(0, 10),
            orderExpiryTime: ticketsExpiryTime
          },
        });

        // Step 5: Initiate payment processing
        const response = await BookingService.createOrder({
          orderId: booking.id,
          orderAmount: totalAmount,
          user,
          ticketsExpiryTime
        });

        if (!response.status) {
          throw new CustomError(response.message, 400);
        }

        // Step 6: Store payment session details in the booking
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentSessionId: response.response.payment_session_id,
          },
        });

        return response;
      },
      { timeout: 15000 }
    );
  }
}

export default CheckoutService;
