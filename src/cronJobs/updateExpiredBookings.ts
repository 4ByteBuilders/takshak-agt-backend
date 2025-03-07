import { PaymentStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import logger from "../utils/logger";
import BookingService from "../services/booking.service";

const updateExpiredBookings = async () => {
    const currTime = new Date(Date.now());

    const pendingExpiredBookings = await prisma.booking.findMany({
        where: {
            paymentStatus: "PENDING",
            orderExpiryTime: {
                lt: currTime
            }
        }
    });

    for (const booking of pendingExpiredBookings) {

        const res = await BookingService.fetchPaymentStatus(booking.id);

        if (res.payment_status === 'SUCCESS') {
            logger.info(`Cron Job: Booking ${booking.id} already paid - Changing status to PAID`);
            await prisma.booking.update({
                where: {
                    id: booking.id
                },
                data: {
                    paymentStatus: PaymentStatus.PAID
                }
            });
            continue;
        }

        await prisma.booking.update({
            where: {
                id: booking.id
            },
            data: {
                paymentStatus: PaymentStatus.EXPIRED
            }
        });
    }
}

export default updateExpiredBookings;