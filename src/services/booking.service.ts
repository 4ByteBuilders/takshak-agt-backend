import prisma from "../utils/prisma";
import { Cashfree } from "cashfree-pg";
import { PaymentStatus, Status } from "@prisma/client";
import { CustomError } from "../utils/CustomError";
import logger from "../utils/logger";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

class BookingService {
  static async fetchRemainingTickets(eventId: string) {
    try {
      // Step 1: Remove expired reservations
      await prisma.ticket.updateMany({
        where: {
          eventId,
          status: "RESERVED",
          reservationExpiresAt: { lt: new Date() }, // Expired reservations
        },
        data: { status: "AVAILABLE", reservationExpiresAt: null },
      });

      // Step 2: Count remaining available tickets
      const remainingTickets = await prisma.ticket.count({
        where: {
          eventId,
          status: "AVAILABLE",
        },
      });

      return { remainingTickets };
    } catch (error) {
      throw new CustomError("Error fetching remaining tickets", 400);
    }
  }

  static async fetchAllUserBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { tickets: true, event: { include: { priceOfferings: true } } },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((booking) => {
      let priceDetails = [];

      // Safely parse priceOfferingSelected if it's a string
      if (typeof booking.priceOfferingSelected === "string") {
        try {
          const parsedOfferings = JSON.parse(booking.priceOfferingSelected);
          priceDetails = Object.entries(parsedOfferings).map(([id, quantity]) => {
            const offering = booking.event.priceOfferings.find((offer) => offer.id === id);
            return offering ? { name: offering.name, price: offering.price, quantity } : null;
          }).filter(Boolean); // Remove any null values
        } catch (error) {
          logger.error("Failed to parse priceOfferingSelected:" + error.toString());
        }
      }

      return {
        ...booking,
        priceDetails,
      };
    });
  }


  static async fetchAmountAndTicketCount(priceOfferingSelected: Record<string, number>) {
    try {
      let totalAmount = 0;
      let totalTickets = 0;

      const priceOfferings = await prisma.priceOffering.findMany({
        where: { id: { in: Object.keys(priceOfferingSelected) } },
      });

      priceOfferings.forEach((priceOffering) => {
        const quantity = priceOfferingSelected[priceOffering.id];
        totalAmount += priceOffering.price * quantity;
        totalTickets += priceOffering.capacity * quantity;
      });

      return { totalAmount, totalTickets };
    } catch (error) {
      throw new CustomError("Error fetching amount and ticket count", 400);
    }
  }

  static async cancelBooking(bookingId: string) {
    return await prisma.$transaction(async (tx) => {
      // Step 1: Fetch the booking along with its tickets
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { tickets: true },
      });

      if (!booking) throw new CustomError("Booking not found", 404);

      // Step 2: Mark the booking as CANCELLED
      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: PaymentStatus.CANCELLED },
      });

      // Step 3: Release the tickets associated with this booking
      await tx.ticket.updateMany({
        where: { id: { in: booking.tickets.map((ticket) => ticket.id) } },
        data: { status: Status.AVAILABLE, reservationExpiresAt: null },
      });

      return { ...booking, paymentStatus: PaymentStatus.CANCELLED };
    });
  }


  static async createOrder({ orderId, orderAmount, user }) {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 16);

    const request = {
      order_amount: orderAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: user.id,
        customer_phone: "9999999999",
        customer_email: user.email,
        customer_name: user.name,
      },
      order_expiry_time: expiryDate.toISOString(),
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment-status?order_id=${orderId}&status={order_status}`,
      },
    };

    try {
      const response = await Cashfree.PGCreateOrder("2023-08-01", request);
      return {
        status: true,
        message: "Order created successfully",
        response: response.data,
      };
    } catch (error) {
      logger.info(JSON.stringify(error.response?.data));
      throw new CustomError(error.response?.data?.message || "Error creating order", 500);
    }
  }

  static async updatePaymentStatus({ orderId, paymentStatus }) {

    if (paymentStatus === 'SUCCESS') {
      paymentStatus = PaymentStatus.PAID;
    } else if (paymentStatus === 'FAILED') {
      paymentStatus = PaymentStatus.FAILED;
    }
    await prisma.booking.update({
      where: {
        id: orderId
      },
      data: { paymentStatus },
    });
  }

  static async fetchPaymentStatus(orderId: string) {
    try {
      const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
      if(response.data.length === 0) {
        return {"payment_status": "PENDING"};
      }
      return response.data[0];
    } catch (error) {
      throw new CustomError("Error fetching payment status", 500);
    }
  }

  static async verifyPaymentSignature({ signature, body, timestamp }) {
    try {
      Cashfree.PGVerifyWebhookSignature(signature, body, timestamp);
    } catch (error) {
      throw new CustomError("Invalid payment signature", 400);
    }
  }

  static async confirmBooking(bookingId: string) {
    return await prisma.$transaction(async (tx) => {
      // Step 1: Fetch the booking along with its tickets
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { tickets: true },
      });

      if (!booking) throw new CustomError("Booking not found", 404);

      logger.info("Booking found: ", booking);

      // Step 2: Ensure the booking isn't already paid or expired
      if (booking.paymentStatus === PaymentStatus.PAID) {
        throw new CustomError("Booking is already confirmed", 400);
      }

      if (booking.orderExpiryTime && booking.orderExpiryTime < new Date()) {
        throw new CustomError("Booking has expired", 400);
      }

      // Step 3: Confirm the booking (mark as PAID)
      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      logger.info("Booking set to PAID: ", booking);

      // Step 4: Mark tickets as BOOKED
      const ticketIds = booking.tickets.map((ticket) => ticket.id);
      await tx.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data: { status: Status.BOOKED, reservationExpiresAt: null },
      });

      return { ...booking, paymentStatus: PaymentStatus.PAID };
    });
  }


  static async fetchOrder(orderId: string) {
    try {
      const response = await Cashfree.PGFetchOrder("2023-08-01", orderId);
      return {
        status: true,
        message: "Order fetched successfully",
        response: response.data,
      };
    } catch (error) {
      throw new CustomError("Error fetching order", 500);
    }
  }

  static async fetchUserBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId, paymentStatus: PaymentStatus.PAID },
      include: { tickets: true, event: { include: { priceOfferings: true } } },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((booking) => {
      let priceDetails = [];

      // Safely parse priceOfferingSelected if it's a string
      if (typeof booking.priceOfferingSelected === "string") {
        try {
          const parsedOfferings = JSON.parse(booking.priceOfferingSelected);
          priceDetails = Object.entries(parsedOfferings).map(([id, quantity]) => {
            const offering = booking.event.priceOfferings.find((offer) => offer.id === id);
            return offering ? { name: offering.name, price: offering.price, quantity } : null;
          }).filter(Boolean); // Remove any null values
        } catch (error) {
          logger.error("Failed to parse priceOfferingSelected:" + error.toString());
        }
      }

      return {
        ...booking,
        priceDetails,
      };
    });
  }


  static async fetchPendingBookings({ userId, eventId }: { userId: string; eventId?: string }) {
    const sixteenMinutesAgo = new Date();
    sixteenMinutesAgo.setMinutes(sixteenMinutesAgo.getMinutes() - 16);

    const whereCondition = {
      userId,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: { gte: sixteenMinutesAgo },
      ...(eventId ? { eventId } : {}), // Include eventId in the query if provided
    };

    const bookings = await prisma.booking.findMany({
      where: whereCondition,
      include: {
        event: { include: { priceOfferings: true } },
        tickets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // If no bookings are found, return null (if eventId is provided) or an empty array
    if (!bookings.length) {
      return eventId ? null : [];
    }

    // Transform the bookings
    const transformedBookings = bookings.map((booking) => {
      let priceOfferingSelected = {};

      // Safely parse priceOfferingSelected if it's a string
      if (typeof booking.priceOfferingSelected === "string") {
        try {
          priceOfferingSelected = JSON.parse(booking.priceOfferingSelected);
        } catch (error) {
          logger.error("Failed to parse priceOfferingSelected:" + error.toString());
        }
      } else {
        priceOfferingSelected = booking.priceOfferingSelected;
      }

      // Map price details
      const priceDetails = Object.entries(priceOfferingSelected).map(([id, quantity]) => {
        const offering = booking.event.priceOfferings.find((offer) => offer.id === id);
        return offering
          ? { eventId: 'NA', id: 'NA', name: offering.name, price: offering.price, capacity: quantity as number }
          : { eventId: 'NA', id: 'NA', name: "Unknown", price: 0, capacity: quantity as number };
      });

      return {
        ...booking,
        event: {
          ...booking.event,
          priceOfferings: priceDetails,
        },
      };
    });

    // If eventId is provided, return the first matching booking (if any)
    if (eventId) {
      return transformedBookings[0] || null;
    }

    // Otherwise, return all transformed bookings
    return transformedBookings;
  }

  static async verifyBooking({ qr }: { qr: string }) {
    const booking = await prisma.booking.findFirst({
      where: {
        qrCode: qr,
        paymentStatus: PaymentStatus.PAID,
      },
      include: {
        tickets: true,
      },
    });

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    return booking;
  }


  static async checkIn({ booking_id, checkedInCount }: { booking_id: string, checkedInCount: number }) {
    const booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      include: { tickets: true },
    });

    if (!booking) {
      throw new CustomError("Booking not found", 404);
    }

    const checkedInCountNumber = Number(checkedInCount);
    const currentCheckIns = booking.numVerifiedAtVenue || 0;

    if (checkedInCountNumber + currentCheckIns > booking.tickets.length) {
      throw new CustomError("Invalid check-in count", 400);
    }

    await prisma.booking.update({
      where: { id: booking_id },
      data: { numVerifiedAtVenue: { increment: checkedInCountNumber } },
    });

    return { ...booking, numVerifiedAtVenue: currentCheckIns + checkedInCountNumber };
  }

}

export default BookingService;
