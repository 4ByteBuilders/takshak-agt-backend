import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import BookingService from "../services/booking.service";
import CheckoutService from "../services/checkout.service";

class BookingController {
    static getBookings = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.body;

        const bookings = await BookingService.getBookings({
            userId
        });

        res.status(200).json(bookings);

    });

    static verifyBooking = asyncHandler(async (req: Request, res: Response) => {
        const { qr } = req.body;
        const booking = await BookingService.verifyBooking({ qr });
        res.status(200).json(booking);
    });

    static checkIn = asyncHandler(async (req: Request, res: Response) => {
        const { booking_id, checkedInCount } = req.body;
        const booking = await BookingService.checkIn({ booking_id, checkedInCount });
        res.status(200).json(booking);
    });

    static createOrder = asyncHandler(async (req: Request, res: Response) => {
        const { eventId, priceOfferings } = req.body;
        const user = req.user;
        const orderDetails = await BookingService.getAmountAndTicketsCount(priceOfferings);

        const response = await CheckoutService.getOrderReady(
            {
                eventId,
                user,
                ticketCounts: orderDetails.ticketsCount,
                totalAmount: orderDetails.amount
            }
        );
        if (response.status) {
            res.status(200).json({ message: 'Order created successfully', data: response.resByCashfree });
        } else {
            res.status(400).json({ message: response.message });
        }
    });
}

export default BookingController;