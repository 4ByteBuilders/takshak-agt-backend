import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import BookingService from "../services/booking.service";
import CheckoutService from "../services/checkout.service";
import logger from "../utils/logger";

class BookingController {
  static getBookings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const bookings = await BookingService.fetchUserBookings(
      userId,
    );

    res.status(200).json(bookings);
  });
  static getRemainingTickets = asyncHandler(
    async (req: Request, res: Response) => {
      const eventId = req.query.eventId as string;
      const remTkts = await BookingService.fetchRemainingTickets(eventId);
      res.status(200).json(remTkts);
    }
  );

  static getAllUserBookings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const bookings = await BookingService.fetchAllUserBookings(userId);

    res.status(200).json(bookings);
  });

  static getPendingBookings = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user.id;
      const eventId = req.query.eventId as string;
      const bookings = await BookingService.fetchPendingBookings({
        userId,
        eventId,
      });
      res.status(200).json(bookings);
    }
  );

  static getPaymentStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const orderId = req.query.order_id as string;

      const paymentStatus = await BookingService.fetchPaymentStatus(orderId);
      if (!paymentStatus) {
        res.status(404).json({ message: "Payment status not found" });
        return;
      }
      const status = (paymentStatus as any).payment_status;


      if (status === 'SUCCESS') {
        await BookingService.updatePaymentStatus({ orderId, paymentStatus: status });
      }
      res.status(200).json(paymentStatus);
    }
  );

  static updatePaymentStatus = asyncHandler(
    async (req: Request, res: Response) => {
      logger.info("Webhook received from Cashfree");
      try {
        const signature = req.headers["x-webhook-signature"];
        const timestamp = req.headers["x-webhook-timestamp"];
        const body = (req as any).rawBody;

        await BookingService.verifyPaymentSignature({ signature, body, timestamp });

        const paymentData = req.body?.data?.payment;
        const orderData = req.body?.data?.order;

        if (!paymentData || !orderData) {
          res.status(200).send('Webhook received: No relevant data');
          return;
        }
        logger.info(`Processing webhook for order ${orderData.order_id}`);
        if (paymentData.payment_status === 'SUCCESS') {
          await BookingService.confirmBooking(orderData.order_id);
          logger.info(`Booking confirmed for order ${orderData.order_id}`);
        }

        res.status(200).send('Webhook processed successfully');
      } catch (error) {
        logger.error("Error processing webhook:" + error.toString());
        res.status(200).send('Webhook received');
      }
    }
  )

  static cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    const paymentStatus = await BookingService.fetchPaymentStatus(bookingId);
    if(paymentStatus.payment_status !== "SUCCESS") {
      const booking = await BookingService.cancelBooking(bookingId);
      res.status(200).json(booking);
      return;
    }
    res.status(400).json({ message: "Booking cannot be cancelled" });
  });

  static verifyBooking = asyncHandler(async (req: Request, res: Response) => {
    const { qr } = req.body;
    const booking = await BookingService.verifyBooking({ qr });
    res.status(200).json(booking);
  });

  static checkIn = asyncHandler(async (req: Request, res: Response) => {
    const { booking_id, checkedInCount } = req.body;
    const booking = await BookingService.checkIn({
      booking_id,
      checkedInCount,
    });
    res.status(200).json(booking);
  });

  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { eventId, priceOfferings } = req.body;
    const user = req.user;
    logger.info("Creating order for user" + user.id);
    const orderDetails = await BookingService.fetchAmountAndTicketCount(
      priceOfferings
    );

    const response = await CheckoutService.getOrderReady({
      eventId,
      user,
      ticketCounts: orderDetails.totalTickets,
      totalAmount: orderDetails.totalAmount,
      priceOfferings,
    });
    if (response.status) {
      res.status(200).json({
        message: "Order created successfully",
        data: response.response,
      });
    } else {
      res.status(400).json({ message: response.message });
    }
  });
}

export default BookingController;
