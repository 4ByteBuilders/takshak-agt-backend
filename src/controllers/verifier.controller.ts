import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import VerifyService from "../services/verfier.service";

class VerifierController {

    static verifyBooking = asyncHandler(async (req: Request, res: Response) => {
        const { qr } = req.body;
        const booking = await VerifyService.verifyBooking({ qr });
        res.status(200).json(booking);
    });

    static checkIn = asyncHandler(async (req: Request, res: Response) => {
        const { bookingId, numToCheckIn } = req.body;
        const booking = await VerifyService.checkIn({
            bookingId,
            numToCheckIn,
        });
        res.status(200).json(booking);
    });

}

export default VerifierController;