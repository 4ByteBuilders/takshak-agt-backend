import prisma from "../utils/prisma";
import { Cashfree } from "cashfree-pg";
import { ConcernStatus, PaymentStatus, Status } from "@prisma/client";
import { CustomError } from "../utils/CustomError";
import logger from "../utils/logger";
import UserService from "./user.service";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
if (process.env.NODE_ENV === "DEV") {
  Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
} else {
  Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;
}

class BookingService {
  static async fetchRemainingTickets(eventId: string) {
    try {
      // Step 1: Remove expired reservations
      // await prisma.ticket.updateMany({
      //   where: {
      //     eventId,
      //     status: "RESERVED",
      //     reservationExpiresAt: { lt: new Date() }, // Expired reservations
      //   },
      //   data: { status: "AVAILABLE", reservationExpiresAt: null },
      // });

      // Step 2: Count remaining available tickets
      const remainingTickets = await prisma.ticket.count({
        where: {
          eventId,
          status: "AVAILABLE",
        },
      });

      return { remainingTickets };
    } catch (error) {
      logger.error("Error fetching remaining tickets:", error);
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
          priceDetails = Object.entries(parsedOfferings)
            .map(([id, quantity]) => {
              const offering = booking.event.priceOfferings.find(
                (offer) => offer.id === id
              );
              return offering
                ? { name: offering.name, price: offering.price, quantity }
                : null;
            })
            .filter(Boolean); // Remove any null values
        } catch (error) {
          logger.error(
            "Failed to parse priceOfferingSelected:" + error.toString()
          );
        }
      }

      return {
        ...booking,
        priceDetails,
      };
    });
  }

  static async fetchAmountAndTicketCount(
    priceOfferingSelected: Record<string, number>
  ) {
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
      totalAmount += (totalAmount * 2.3) / 100;
      totalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100;

      return { totalAmount, totalTickets };
    } catch (error) {
      logger.error("Error fetching amount and ticket count:", error);
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
        where: { id: bookingId, paymentStatus: { not: PaymentStatus.PAID } },
        data: { paymentStatus: PaymentStatus.CANCELLED },
      });

      // Step 3: Release the tickets associated with this booking
      // await tx.ticket.updateMany({
      //   where: { id: { in: booking.tickets.map((ticket) => ticket.id) } },
      //   data: { status: Status.AVAILABLE, reservationExpiresAt: null },
      // });

      return { ...booking, paymentStatus: PaymentStatus.CANCELLED };
    });
  }

  static async createOrder({ orderId, orderAmount, user, ticketsExpiryTime }) {
    const userFromDb = await UserService.getUser(user.id);

    const request = {
      order_amount: orderAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: userFromDb.supabaseId,
        customer_phone: userFromDb.phoneNumber,
        customer_email: userFromDb.email,
        customer_name: userFromDb.name,
      },
      order_expiry_time: ticketsExpiryTime.toISOString(),
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
      logger.error("Error creating order:", error);
      throw new CustomError(
        error.response?.data?.message || "Error creating order",
        500
      );
    }
  }

  static async updatePaymentStatus({ orderId, paymentStatus }) {
    try {
      if (paymentStatus === "SUCCESS") {
        paymentStatus = PaymentStatus.PAID;
      } else if (paymentStatus === "FAILED" || paymentStatus === "VOID") {
        paymentStatus = PaymentStatus.FAILED;
      }
      else if (paymentStatus === "PENDING" || paymentStatus === "NOT_ATTEMPTED" || paymentStatus === "USER_DROPPED") {
        paymentStatus = PaymentStatus.PENDING;
      }
      else {
        paymentStatus = PaymentStatus.CANCELLED;
      }
      logger.info(`CHUD GYE GURU - Booking ${orderId} is being confirmed - wenHook Booking Service ${paymentStatus}`);
      await prisma.booking.update({
        where: {
          id: orderId,
        },
        data: { paymentStatus },
      });
      // const ticketIds = booking.tickets.map((ticket) => ticket.id);
      // await prisma.ticket.updateMany({
      //   where: { id: { in: ticketIds } },
      //   data: { status: Status.BOOKED, reservationExpiresAt: null },
      // });
    } catch (err) {
      logger.error("Error updating payment status:", err);
      throw new CustomError("Error updating payment status", 500);
    }
  }

  static async fetchPaymentStatus(orderId: string) {
    try {
      const response = await Cashfree.PGOrderFetchPayments(
        "2023-08-01",
        orderId
      );
      if (response.data.length === 0) {
        return { payment_status: "PENDING" };
      }
      for (const data of response.data) {
        if (data.payment_status === "SUCCESS") {
          await BookingService.updatePaymentStatus({
            orderId,
            paymentStatus: data.payment_status,
          });
          return data;
        }
      }
      // return response.data[0];
    } catch (error) {
      logger.error("Error fetching payment status:", error);
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
    try {

      return await prisma.$transaction(async (tx) => {
        // Step 1: Fetch the booking along with its tickets
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { tickets: true },
        });

        if (!booking) throw new CustomError("Booking not found", 404);

        // Step 2: Ensure the booking isn't already paid or expired
        if (booking.paymentStatus === PaymentStatus.PAID) {
          throw new CustomError("Booking is already confirmed", 400);
        }

        if (booking.orderExpiryTime && booking.orderExpiryTime < new Date()) {
          throw new CustomError("Booking has expired", 400);
        }
        logger.info(`CHUD GYE GURU - Booking ${bookingId} is being confirmed - confirmBooking Booking Service`);
        // Step 3: Confirm the booking (mark as PAID)
        await tx.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: PaymentStatus.PAID },
        });
        // Step 4: Mark tickets as BOOKED
        // const ticketIds = booking.tickets.map((ticket) => ticket.id);
        // await tx.ticket.updateMany({
        //   where: { id: { in: ticketIds } },
        //   data: { status: Status.BOOKED, reservationExpiresAt: null },
        // });

        return { ...booking, paymentStatus: PaymentStatus.PAID };
      });
    } catch (err) {
      logger.error("Error confirming booking:", err);
      throw new CustomError("Error confirming booking", 500);
    }
  }

  static updateBookingStatusToPaid = async (bookingId: string) => {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: PaymentStatus.PAID },
    });
  };


  static async fetchOrder(orderId: string) {
    try {
      const response = await Cashfree.PGFetchOrder("2023-08-01", orderId);
      return {
        status: true,
        message: "Order fetched successfully",
        response: response.data,
      };
    } catch (error) {
      logger.error("Error fetching order:", error);
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
          priceDetails = Object.entries(parsedOfferings)
            .map(([id, quantity]) => {
              const offering = booking.event.priceOfferings.find(
                (offer) => offer.id === id
              );
              return offering
                ? { name: offering.name, price: offering.price, quantity }
                : null;
            })
            .filter(Boolean); // Remove any null values
        } catch (error) {
          logger.error(
            "Failed to parse priceOfferingSelected:" + error.toString()
          );
        }
      }

      return {
        ...booking,
        priceDetails,
      };
    });
  }

  static async fetchPendingBookings({
    userId,
    eventId,
  }: {
    userId: string;
    eventId?: string;
  }) {
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
          logger.error(
            "Failed to parse priceOfferingSelected:" + error.toString()
          );
        }
      } else {
        priceOfferingSelected = booking.priceOfferingSelected;
      }

      // Map price details
      const priceDetails = Object.entries(priceOfferingSelected).map(
        ([id, quantity]) => {
          const offering = booking.event.priceOfferings.find(
            (offer) => offer.id === id
          );
          return offering
            ? {
              eventId: "NA",
              id: "NA",
              name: offering.name,
              price: offering.price,
              capacity: quantity as number,
            }
            : {
              eventId: "NA",
              id: "NA",
              name: "Unknown",
              price: 0,
              capacity: quantity as number,
            };
        }
      );

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
  static createConcern = async (
    bookingId: string,
    message: string,
    contact: string,
    email: string
  ) => {
    try {
      const concern = await prisma.concern.create({
        data: {
          bookingId,
          message,
          contact,
          email,
        },
      });

      return { success: true, concern };
    } catch (error) {
      logger.error("Error raising concern:", error);
      return { success: false, error: "Failed to raise concern" };
    }
  };

  static fetchConcerns = async () => {
    try {
      const concerns = await prisma.concern.findMany();
      return concerns;
    } catch (error) {
      logger.info("Error fetching concerns:", error);
      return [];
    }
  }

  static updateConcernStatus = async (concernId: string, status: string) => {
    try {
      const concern = await prisma.concern.update({
        where: { id: concernId },
        data: { status: status === "RESOLVED" ? ConcernStatus.RESOLVED : ConcernStatus.UNRESOLVED },
      });

      return { success: true, concern };
    } catch (error) {
      logger.error("Error updating concern status:", error);
      return { success: false, error: "Failed to update concern status" };
    }
  };

}

export default BookingService;
