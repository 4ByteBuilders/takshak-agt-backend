import { Router } from "express";
import BookingController from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, BookingController.getBookings);
router.post("/create-order", authMiddleware, BookingController.createOrder);
// router.get("/get-booking", authMiddleware, BookingController.getBooking); TO DO
router.post('/verify-booking', BookingController.verifyBooking);
router.post('/check-in', BookingController.checkIn);
export default router;