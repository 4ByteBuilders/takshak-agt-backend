import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import VerifyService from "../services/verfier.service";

class VerifierController {

    static getAll = asyncHandler(async (req: Request, res: Response) => {
        const verifiers = await VerifyService.getAll();
        res.status(200).json(verifiers);
    });

    static addVerifier = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        const verifier = await VerifyService.addVerifier({ email });
        res.status(200).json(verifier);
    });

    static removeVerifier = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.body;
        const verifier = await VerifyService.removeVerifier({ id });
        res.status(200).json(verifier);
    });

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