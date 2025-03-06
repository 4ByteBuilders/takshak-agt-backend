import { Status } from "@prisma/client";
import prisma from "../utils/prisma";

class EventService {

    static async fetchAvailableTickets({ eventId }) {
        const availableTicketCount = await prisma.ticket.count({
            where: {
                eventId,
                status: Status.AVAILABLE,
            },
        });

        return availableTicketCount;
        
    }

    static async create({ title, venue, dateTime, totalNumberOfTickets, description, photoUrls, priceOfferings }) {
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


            const tickets = Array.from({ length: event.totalNumberOfTickets }, () => ({
                eventId: event.id,
                status: Status.AVAILABLE,
            }));

            await tx.ticket.createMany({ data: tickets });

            return event;
        });
    }

    static async getLatestEvent() {
        return await prisma.event.findFirst({
            where: {
                dateTime: {
                    gt: new Date(),
                },
            },
            include: {
                priceOfferings: true
            },
            orderBy: {
                dateTime: 'asc',
            },
        });
    }

}

export default EventService;