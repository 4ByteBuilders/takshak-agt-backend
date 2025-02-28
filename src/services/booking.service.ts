import prisma from "../utils/prisma";
import {v4 as uuidv4} from 'uuid';

class BookingService { 
    
    static async tempCreateBooking({ eventId, quantity, userId }) {
        return await prisma.$transaction(async (prisma) => {
            const tickets = await prisma.ticket.findMany({
            where: {
                eventId,
                status: 'AVAILABLE'
            },
            take: quantity
            });

            if (tickets.length < quantity) {
            throw new Error('Not enough tickets available');
            }

            const ticketIds = tickets.map(ticket => ticket.id);

            await prisma.ticket.updateMany({
            where: {
                id: { in: ticketIds }
            },
            data: {
                status: 'BOOKED'
            }
            });

            const booking = await prisma.booking.create({
            data: {
                userId,
                tickets: {
                connect: ticketIds.map(id => ({ id }))
                },
                amountPaid: 696969, //just a temporary thing
                paymentStatus: 'PENDING',
                numVerifiedAtVenue: 0,
                qrCode: uuidv4().slice(0, 10)
            }
            });

            return booking;
        });
    }

    static async getBookings({userId}) {
        const bookings = prisma.booking.findMany({
            where: {
                userId
            },
            include : {
                tickets : true
            }
        });
        return bookings;
    }
    
    static async verifyBooking({qr}){

        const booking = await prisma.booking.findUnique({
            where: {
                qrCode : qr
            },
            include : {
                tickets : true
            }
        });
        
        if(!booking){
            throw new Error('Booking not found');
        }
    
        return booking;

    }

    static async checkIn({booking_id, checkedInCount}){
        const booking = await prisma.booking.findUnique({
            where: {
                id: booking_id
            },
            include : {
                tickets : true
            }
        });

        if(!booking){
            throw new Error('Booking not found');
        }

        if(checkedInCount + booking.numVerifiedAtVenue > booking.tickets.length){
            throw new Error('Invalid check-in count');
        }

        await prisma.booking.update({
            where: {
                id: booking_id
            },
            data: {
                numVerifiedAtVenue: {
                    increment: checkedInCount
                }
            }
        });

        return booking;

    }

}

export default BookingService;