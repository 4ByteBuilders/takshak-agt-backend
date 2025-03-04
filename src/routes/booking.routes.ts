import { Router } from "express";
import BookingController from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, BookingController.getBookings);
router.get("/remaining-tickets", BookingController.getRemainingTickets);

router.post("/create-order", authMiddleware, BookingController.createOrder);
router.post("/confirm-order", BookingController.confirmBooking);
router.post("/cancel-booking", BookingController.cancelBooking);

router.post("/verify-booking", BookingController.verifyBooking);
router.post("/check-in", BookingController.checkIn);


router.get("/get-bookings", authMiddleware, BookingController.getBookings);
router.get("/get-pending-bookings", authMiddleware, BookingController.getPendingBookings);
router.get("/payment-status", authMiddleware, BookingController.getPaymentStatus);
router.get("/get-pending-bookings", authMiddleware, BookingController.getPendingBookings);
router.post("/update-payment-status", BookingController.updatePaymentStatus);

export default router;
