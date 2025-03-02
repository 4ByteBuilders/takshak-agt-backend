import prisma from "../utils/prisma";
import { v4 as uuidv4 } from 'uuid';
import { Cashfree } from "cashfree-pg";
import { getCurrentDateFormatted } from "../utils/dateUtils";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

class BookingService {

    static async createBookingTableEntry({ eventId, quantity, userId }) {
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

    static getAmountAndTicketsCount = async (priceOfferingSelected: Object) => {
        let amount = 0;
        let ticketsCount = 0;

        const priceOfferings = await prisma.priceOffering.findMany({
            where: {
                id: {
                    in: Object.keys(priceOfferingSelected)
                }
            }
        });
        priceOfferings.forEach(priceOffering => {
            amount += priceOffering.price * priceOfferingSelected[priceOffering.id];
            ticketsCount += priceOffering.capacity * priceOfferingSelected[priceOffering.id];
        });

        return { amount, ticketsCount };
    }

    static createOrder = async ({ order_id, order_amount, user }) => {
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 16);
        const orderExpiryTime = expiryDate.toISOString();

        var request = {
            "order_amount": order_amount,
            "order_currency": "INR",
            "order_id": order_id,
            "customer_details": {
                "customer_id": user.id,
                "customer_phone": "9999999999",
                "customer_email": user.email,
                "customer_name": user.name
            },
            "order_expiry_time": orderExpiryTime,
            "order_meta": {
                "return_url": `https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id=${order_id}`
            }
        };

        return Cashfree.PGCreateOrder("2023-08-01", request).then((response) => {
            return { status: true, message: 'Order Created successfully:' + response.data };
        }).catch((error) => {
            return { status: false, message: 'Error:' + error.response.data.message };
        });
    };

    static getOrder = async (order_id: string) => {

        Cashfree.PGFetchOrder("2023-08-01", order_id).then((response) => {
            return { status: true, message: 'Order fetched successfully:' + response.data };
        }).catch((error) => {
            return { status: false, message: 'Error:' + error.response.data.message };
        });
    };

    static async getBookings({ userId }) {
        const bookings = prisma.booking.findMany({
            where: {
                userId
            },
            include: {
                tickets: true
            }
        });
        return bookings;
    }

    static async verifyBooking({ qr }) {

        const booking = await prisma.booking.findUnique({
            where: {
                qrCode: qr
            },
            include: {
                tickets: true
            }
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        return booking;

    }

    static async checkIn({ booking_id, checkedInCount }) {
        const booking = await prisma.booking.findUnique({
            where: {
                id: booking_id
            },
            include: {
                tickets: true
            }
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (checkedInCount + booking.numVerifiedAtVenue > booking.tickets.length) {
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