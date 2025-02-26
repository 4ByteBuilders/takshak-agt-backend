import { PrismaClient, Status } from "@prisma/client";
import prisma from "../utils/prisma";
import redisClient from "../utils/redis";

class EventService {
  static async create({
    title,
    venue,
    dateTime,
    totalNumberOfTickets,
    description,
    photoUrls,
    priceOfferings,
  }) {
    return await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title,
          venue,
          dateTime,
          totalNumberOfTickets,
          description,
          photoUrls,
          priceOfferings: {
            create: priceOfferings,
          },
        },
      });

      const tickets = Array.from(
        { length: event.totalNumberOfTickets },
        () => ({
          eventId: event.id,
          status: Status.AVAILABLE,
        })
      );

      await tx.ticket.createMany({ data: tickets });

      return event;
    });
  }
  static async bookEvent({ eventId, priceOfferingId, quantity, userId }) {
    return await prisma.$transaction(async (tx) => {
      const priceOffering = await tx.priceOffering.findUnique({
        where: {
          id_eventId: {
            id: priceOfferingId,
            eventId: eventId,
          },
        },
      });

      if (!priceOffering) {
        throw new Error("Price offering not found");
      }

      const totalTicketsRequired = quantity * priceOffering.capacity;

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
        take: totalTicketsRequired,
      });

      if (availableTickets.length < totalTicketsRequired) {
        throw new Error("Not enough available tickets");
      }

      const ticketIds = availableTickets.map((ticket) => ticket.id);
      const pipeline = redisClient.pipeline();
      ticketIds.forEach((ticketId) => {
        pipeline.set(`locked_ticket:${eventId}:${ticketId}`, userId, "EX", 60); // Set TTL to 60 seconds
      });
      await pipeline.exec();
      return ticketIds;
    });
  }

  static async viewEvent({ eventId }) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        priceOfferings: true,
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    return event;
  }

}

export default EventService;
