import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import BookingService from "../services/booking.service";

class BookingController {
    static getBookings = asyncHandler(async (req : Request, res : Response) => {
        const { userId } = req.body;

        const bookings = await BookingService.getBookings({
            userId
        });

        res.status(200).json(bookings);

    });
    
    static temporaryBookEvent = asyncHandler(async (req : Request, res : Response) =>{
        const { eventId, quantity, userId } = req.body;
        const booking = await BookingService.tempCreateBooking({ eventId,  quantity, userId });
        res.status(201).json(booking);
    });

    static verifyBooking = asyncHandler(async (req : Request, res : Response) => {
        const { qr} = req.body;
        const booking = await BookingService.verifyBooking({ qr });
        res.status(200).json(booking);
    });

    static checkIn = asyncHandler(async (req : Request, res : Response) => {
        const { booking_id, checkedInCount } = req.body;
        const booking = await BookingService.checkIn({ booking_id, checkedInCount });
        res.status(200).json(booking);
    });

}

export default BookingController;