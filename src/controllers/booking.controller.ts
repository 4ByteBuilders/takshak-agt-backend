import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import BookingService from "../services/booking.service";
import CheckoutService from "../services/checkout.service";

class BookingController {
  static getBookings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const bookings = await BookingService.getBookings({
      userId,
    });

    res.status(200).json(bookings);
  });
  static getRemainingTickets = asyncHandler(
    async (req: Request, res: Response) => {
      const remTkts = await BookingService.getRemainingTickets();
      res.status(200).json(remTkts);
    }
  );

  static getPendingBookings = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user.id;
      const eventId = req.query.eventId as string;
      const bookings = await BookingService.getPendingBookings({
        userId,
        eventId,
      });
      res.status(200).json(bookings);
    }
  );

  static getPaymentStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const orderId = req.query.order_id as string;
      const paymentStatus = await BookingService.getPaymentStatus(orderId);
      res.status(200).json(paymentStatus);
    }
  );

  static updatePaymentStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { data } = req.body;
      console.log(data);
      res.status(200);
    }
  )

  static confirmBooking = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.body;
    const booking = await BookingService.confirmOrder(bookingId);
    res.status(201).json(booking);
  });

  static cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.body;
    const booking = await BookingService.cancelBooking(bookingId);
    res.status(200).json(booking);
  });

  static verifyBooking = asyncHandler(async (req: Request, res: Response) => {
    const { qr } = req.body;
    console.log(qr);
    const booking = await BookingService.verifyBooking({ qr });
    res.status(200).json(booking);
  });

  static checkIn = asyncHandler(async (req: Request, res: Response) => {
    const { booking_id, checkedInCount } = req.body;
    console.log(booking_id, checkedInCount);
    const booking = await BookingService.checkIn({
      booking_id,
      checkedInCount,
    });
    res.status(200).json(booking);
  });

  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { eventId, priceOfferings } = req.body;
    const user = req.user;
    const orderDetails = await BookingService.getAmountAndTicketsCount(
      priceOfferings
    );

    const response = await CheckoutService.getOrderReady({
      eventId,
      user,
      ticketCounts: orderDetails.ticketsCount,
      totalAmount: orderDetails.amount,
      priceOfferings,
    });
    if (response.status) {
      res.status(200).json({
        message: "Order created successfully",
        data: response.resByCashfree,
      });
    } else {
      res.status(400).json({ message: response.message });
    }
  });
}

export default BookingController;
