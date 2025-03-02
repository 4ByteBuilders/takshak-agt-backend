import { Router } from "express";
import BookingController from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, BookingController.getBookings);
router.post("/create-order", authMiddleware, BookingController.createOrder);
router.post("/confirm-order", BookingController.confirmBooking);

router.post("/verify-booking", BookingController.verifyBooking);
router.post("/check-in", BookingController.checkIn);
router.get("/get-bookings", authMiddleware, BookingController.getBookings);
router.get(
  "/get-pending-bookings",
  authMiddleware,
  BookingController.getPendingBookings
);
export default router;
