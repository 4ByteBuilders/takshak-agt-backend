import { Status } from "@prisma/client";
import prisma from "../utils/prisma";
import redisClient from "../utils/redis";
import { v4 as uuidv4 } from "uuid";
import BookingService from "./booking.service";
import { CustomError } from "../utils/CustomError";

class CheckoutService {
  static async getOrderReady({ eventId, user, ticketCounts, totalAmount, priceOfferings, }) {
    return await prisma.$transaction(
      async (tx) => {

        const lockedTickets = await redisClient.keys(`locked_ticket:*`);
        const lockedTicketIds = lockedTickets.map((key) =>
          key.split(":").pop()
        );

        const availableTickets = await tx.ticket.findMany({
          where: {
            eventId,
            status: Status.AVAILABLE,
            id: {
              notIn: lockedTicketIds,
            },
          },
          take: ticketCounts,
        });

        if (availableTickets.length < ticketCounts) {
          throw new CustomError("Not enough available tickets", 400);
        }

        const ticketIds = availableTickets.map((ticket) => ticket.id);
        const pipeline = redisClient.pipeline();
        const booking = await tx.booking.create({
          data: {
            userId: user.id,
            tickets: {
              connect: ticketIds.map((id) => ({ id })),
            },
            amountPaid: totalAmount,
            eventId,
            priceOfferingSelected: JSON.stringify(priceOfferings),
            paymentStatus: "PENDING",
            numVerifiedAtVenue: 0,
            qrCode: uuidv4().slice(0, 10),
          },
        });


        ticketIds.forEach((ticketId) => {
          pipeline.set(
            `locked_ticket:${booking.id}:${ticketId}`,
            user.id,
            "EX",
            1120
          );
        });

        await pipeline.exec();

        const response = await BookingService.createOrder({
          orderId: booking.id,
          orderAmount: totalAmount,
          user,
        });

        if (!response.status) {
          throw new CustomError(response.message, 400);
        }
        await tx.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            paymentSessionId: response.response.payment_session_id,
            orderExpiryTime: response.response.order_expiry_time,
          },
        });
        return response;
      },
      { timeout: 15000 }
    );
  }
}

export default CheckoutService;
