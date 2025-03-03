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
<<<<<<< HEAD
router.get("/get-pending-bookings", authMiddleware, BookingController.getPendingBookings);
router.get("/payment-status", authMiddleware, BookingController.getPaymentStatus);
=======
router.get(
  "/get-pending-bookings",
  authMiddleware,
  BookingController.getPendingBookings
);

>>>>>>> d55fb4d51749ef70d6f7815a745c4b9958498dfa
export default router;
