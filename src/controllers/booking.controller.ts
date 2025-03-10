import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import BookingService from "../services/booking.service";
import CheckoutService from "../services/checkout.service";
import logger from "../utils/logger";

class BookingController {
  static getBookings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const bookings = await BookingService.fetchUserBookings(userId);

    res.status(200).json(bookings);
  });
  static getRemainingTickets = asyncHandler(
    async (req: Request, res: Response) => {
      const eventId = req.query.eventId as string;
      const remTkts = await BookingService.fetchRemainingTickets(eventId);
      res.status(200).json(remTkts);
    }
  );

  static getAllUserBookings = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user.id;
      const bookings = await BookingService.fetchAllUserBookings(userId);

      res.status(200).json(bookings);
    }
  );

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

      if (status === "SUCCESS") {
        await BookingService.updatePaymentStatus({
          orderId,
          paymentStatus: status,
        });
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

        await BookingService.verifyPaymentSignature({
          signature,
          body,
          timestamp,
        });

        const paymentData = req.body?.data?.payment;
        const orderData = req.body?.data?.order;

        if (!paymentData || !orderData) {
          res.status(200).send("Webhook received: No relevant data");
          return;
        }
        if (paymentData.payment_status === "SUCCESS") {
          // await BookingService.confirmBooking(orderData.order_id);
          await BookingService.updateBookingStatusToPaid(orderData.order_id);
          logger.info(`Booking confirmed for order ${orderData.order_id}`);
        }

        res.status(200).send("Webhook processed successfully");
      } catch (error) {
        logger.error("Error processing webhook:", error);
        res.status(200).send("Webhook received");
      }
    }
  );

  static cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    const paymentStatus = await BookingService.fetchPaymentStatus(bookingId);
    if (paymentStatus.payment_status !== "SUCCESS") {
      const booking = await BookingService.cancelBooking(bookingId);
      res.status(200).json(booking);
      return;
    }
    res.status(400).json({ message: "Booking cannot be cancelled" });
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
  static createConcern = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId, message, contact, email } = req.body;

    const concern = await BookingService.createConcern(
      bookingId,
      message,
      contact,
      email
    );
    if (concern.success) {
      res.status(200).json(concern);
      return;
    }
    res.status(400).json({ message: "Concern couldn't be created" });
  });

  static getConcerns = asyncHandler(async (req: Request, res: Response) => {
    const concerns = await BookingService.fetchConcerns();
    res.status(200).json(concerns);
  });

  static updateConcernStatus = asyncHandler(async (req: Request, res: Response) => {
    const { concernId, status } = req.body;
    const concern = await BookingService.updateConcernStatus(concernId, status);
    res.status(200).json(concern);
  });

}

export default BookingController;
