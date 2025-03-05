import { PaymentStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import logger from "../utils/logger";

const updateExpiredBookings = async () => {
    const cutoffTime = new Date(Date.now() - 16 * 60 * 1000); // 16 minutes before now

    const pendingExpiredBookings = await prisma.booking.findMany({
        where : {
            paymentStatus : PaymentStatus.PENDING,
            createdAt : {
                lt : cutoffTime
            }
        }
    });

    for(const booking of pendingExpiredBookings){
        await prisma.booking.update({
            where : {
                id : booking.id
            },
            data : {
                paymentStatus : PaymentStatus.EXPIRED
            }
        });
    }

   logger.info(`[${new Date().toISOString()}] Updated ${pendingExpiredBookings.length} expired bookings`);
    
}

export default updateExpiredBookings;