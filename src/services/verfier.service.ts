import { PaymentStatus } from "@prisma/client";
import { CustomError } from "../utils/CustomError";
import prisma from "../utils/prisma";
import supabase from "../utils/supabaseClient";

class VerifyService {

    static async getAll() {
        const verifiers = await prisma.verifier.findMany();
        return verifiers;
    }

    static async addVerifier({ email }: { email: string }) {
        const verifier = await prisma.verifier.create({
            data: {
                email
            },
        });
        return verifier;
    }

    static async removeVerifier({ id }: { id: string }) {
        const verifier = await prisma.verifier.findFirst({
            where: { id },
        });

        if (!verifier) {
            throw new CustomError("Verifier not found", 404);
        }

        await prisma.verifier.delete({
            where: { id },
        });

        return verifier;
    }

    static async verifyBooking({ qr }: { qr: string }) {
        const booking = await prisma.booking.findFirst({
            where: {
                qrCode: qr,
                paymentStatus: PaymentStatus.PAID,
            },
            include: { tickets: true }
        });
        if (!booking) {
            throw new CustomError("Booking not found", 404);
        }
        const ticketLength = booking?.tickets.length || 0;
        const user = await supabase.auth.admin.getUserById(booking?.userId);
        const userDetails = user?.data.user.user_metadata;

        return { ...booking, totalPeople: ticketLength, user: userDetails };
    }


    static async checkIn({ bookingId, numToCheckIn }: { bookingId: string, numToCheckIn: number }) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { tickets: true },
        });

        if (!booking) {
            throw new CustomError("Booking not found", 404);
        }

        const checkedInCountNumber = Number(numToCheckIn);
        const currentCheckIns = booking.numVerifiedAtVenue || 0;

        if (checkedInCountNumber + currentCheckIns > booking.tickets.length) {
            throw new CustomError("Invalid check-in count", 400);
        }

        await prisma.booking.update({
            where: { id: bookingId },
            data: { numVerifiedAtVenue: { increment: checkedInCountNumber } },
        });

        return { ...booking, numVerifiedAtVenue: currentCheckIns + checkedInCountNumber };
    }
}

export default VerifyService;