import { Router } from "express";
import BookingController from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();


router.post("/create-order", authMiddleware, BookingController.createOrder);
router.post("/cancel-booking", BookingController.cancelBooking);

router.get("/get-all-user-bookings", authMiddleware, BookingController.getAllUserBookings);

router.get("/remaining-tickets", authMiddleware, BookingController.getRemainingTickets);
router.get("/get-bookings", authMiddleware, BookingController.getBookings);
router.get("/get-pending-bookings", authMiddleware, BookingController.getPendingBookings);
router.get("/payment-status", authMiddleware, BookingController.getPaymentStatus);
router.get("/get-pending-bookings", authMiddleware, BookingController.getPendingBookings);
router.post("/update-payment-status", BookingController.updatePaymentStatus);

export default router;
