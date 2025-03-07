import { MessageStatus, Status } from "@prisma/client";
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
                    photoUrls: JSON.stringify(photoUrls),
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

            // ADD LOGIC TO UPLOAD IMAGES TO SUPABASE BUCKET

            return event;
        });
    }

    static async getAllEvents() {
        return await prisma.event.findMany({
            include: {
                priceOfferings: true,
            },
        });
    }

    static async deleteEvent({ eventId }) {
        await prisma.$transaction(async (tx) => {
            await tx.ticket.deleteMany({
                where: { eventId },
            });

            await tx.priceOffering.deleteMany({
                where: { eventId },
            });

            await tx.booking.deleteMany({
                where: { eventId },
            });

            await tx.event.delete({
                where: { id: eventId },
            });
        });
        return eventId;
    };

    static async getAllMessages() {
        try {
            const response = await prisma.message.findMany();
            return response;
        } catch (error) {
            throw new Error(error);
        }
    }

    static async changeMessageStatus(messageId: string, status: MessageStatus) {
        try {
            const response = await prisma.message.update({
                where: {
                    id: messageId
                },
                data: {
                    status
                }
            });
            return response;
        } catch (error) {
            throw new Error(error);
        }
    }

}

export default AdminService;