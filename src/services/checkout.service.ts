import { Status } from "@prisma/client";
import prisma from "../utils/prisma";
import redisClient from "../utils/redis";
import { v4 as uuidv4 } from "uuid";
import BookingService from "./booking.service";

class CheckoutService {
    static async getOrderReady({ eventId, user, ticketCounts, totalAmount }) {
        return await prisma.$transaction(async (tx) => {
            const lockedTickets = await redisClient.keys(
                `locked_ticket:${eventId}:*`
            );

            const lockedTicketIds = lockedTickets.map((key) => key.split(":").pop());
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
                throw new Error("Not enough available tickets");
            }

            const ticketIds = availableTickets.map((ticket) => ticket.id);
            const pipeline = redisClient.pipeline();
            ticketIds.forEach((ticketId) => {
                pipeline.set(`locked_ticket:${eventId}:${ticketId}`, user.id, "EX", 600);
            });
            await pipeline.exec();

            // Create a booking entry
            const booking = await tx.booking.create({
                data: {
                    userId: user.id,
                    tickets: {
                        connect: ticketIds.map(id => ({ id }))
                    },
                    amountPaid: totalAmount,
                    paymentStatus: 'PENDING',
                    numVerifiedAtVenue: 0,
                    qrCode: uuidv4().slice(0, 10)
                }
            });

            // Create order in Cashfree
            const response = await BookingService.createOrder({
                order_id: booking.id,
                order_amount: totalAmount,
                user
            });

            if (!response.status) {
                throw new Error(response.message);
            }

            return response;
        });
    }
}

export default CheckoutService;