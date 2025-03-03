import { Status } from "@prisma/client";
import prisma from "../utils/prisma";

class AdminService {
    static async createEvent({ title, venue, dateTime, totalNumberOfTickets, description, photoUrls, priceOfferings }) {
        return await prisma.$transaction(async (tx) => {

            const event = await tx.event.create({
                data: {
                    title,
                    venue,
                    dateTime,
                    totalNumberOfTickets,
                    description,
                    photoUrls : JSON.stringify(photoUrls),
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
}

export default AdminService;