import prisma from "../utils/prisma";
import { v4 as uuidv4 } from "uuid";
import { Cashfree } from "cashfree-pg";
import { getCurrentDateFormatted } from "../utils/dateUtils";
import {PaymentStatus} from "@prisma/client";
import redisClient from "../utils/redis";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

class BookingService {

  static getRemainingTickets = async () => {
    const event = await prisma.event.findFirst({
      include: { tickets: { where: { status: "AVAILABLE" } } },
    });
    if (!event) return new Error("No Event found!!");
    const lockedTickets = await redisClient.dbsize();
    const res = event.tickets.length - lockedTickets;
    return { remainingTickets: res };
  };

  static getAmountAndTicketsCount = async (priceOfferingSelected: Object) => {
    let amount = 0;
    let ticketsCount = 0;

    const priceOfferings = await prisma.priceOffering.findMany({
      where: {
        id: {
          in: Object.keys(priceOfferingSelected),
        },
      },
    });
    priceOfferings.forEach((priceOffering) => {
      amount += priceOffering.price * priceOfferingSelected[priceOffering.id];
      ticketsCount +=
        priceOffering.capacity * priceOfferingSelected[priceOffering.id];
    });

    return { amount, ticketsCount };
  };

  static cancelBooking = async (bookingId: string) => {
      return await prisma.$transaction(async (prisma) => {
          console.log("TESTING...");
          console.log(bookingId);
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { tickets: true },
      });

      if (!booking) {
        throw new Error("Booking not found!!");
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: PaymentStatus.CANCELLED },
      });


      //   REMOVE LOCKED TICKETS FROM REDIS
      const pipeline = redisClient.pipeline();

      booking.tickets.forEach((ticket) => {
        pipeline.del(`locked_ticket:${bookingId}:${ticket.id}`);
      });

      await pipeline.exec();

      booking.paymentStatus = PaymentStatus.CANCELLED;
      return booking;
    });
  };

  static createOrder = async ({ order_id, order_amount, user }) => {
    const currentDate = getCurrentDateFormatted();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 16);
    const orderExpiryTime = expiryDate.toISOString();

    var request = {
      order_amount: order_amount,
      order_currency: "INR",
      order_id: order_id,
      customer_details: {
        customer_id: user.id,
        customer_phone: "9999999999",
        customer_email: user.email,
        customer_name: user.name,
      },
      order_expiry_time: orderExpiryTime,
      order_meta: {
        return_url: `https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id=${order_id}`,
      },
    };

    return Cashfree.PGCreateOrder("2023-08-01", request)
      .then((response) => {
        return {
          status: true,
          message: "Order created successfully:",
          resByCashfree: response.data,
        };
      })
      .catch((error) => {
        return {
          status: false,
          message: "Error:" + (error.response.data.message as string),
          resByCashfree: error.response.data,
        };
      });
  };
  static confirmOrder = async (bookingId: string) => {
    return await prisma.$transaction(async (prisma) => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { tickets: true },
      });
      if (!booking) {
        throw new Error("Booking not found!!");
      }
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: "PAID" },
      });
      const pipeline = redisClient.pipeline();
      booking.tickets.forEach((ticket) => {
        console.log(ticket.id);
        pipeline.del(`locked_ticket:${bookingId}:${ticket.id}`);
      });
      await pipeline.exec();
      booking.paymentStatus = "PAID";
      return booking;
    });
  };
  static getOrder = async (order_id: string) => {
    const currentDate = getCurrentDateFormatted();

    Cashfree.PGFetchOrder("2023-08-01", order_id)
      .then((response) => {
        return {
          status: true,
          message: "Order fetched successfully:",
          resByCashfree: response.data,
        };
      })
      .catch((error) => {
        return {
          status: false,
          message: "Error:" + error.response.data.message,
        };
      });
  };

  static async getBookings({ userId }) {
    const bookings = await prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        tickets: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return bookings;
  }

  static async getPendingBookings({ userId, eventId }) {
    const sixteenMinutesAgo = new Date();
    sixteenMinutesAgo.setMinutes(sixteenMinutesAgo.getMinutes() - 16);

    const bookings = await prisma.booking.findFirst({
      where: {
        userId,
        eventId,
        paymentStatus: "PENDING",
        createdAt: {
          gte: sixteenMinutesAgo,
        },
      },
      include: {
        tickets: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return bookings;
  }

  static async verifyBooking({ qr }) {
    const booking = await prisma.booking.findUnique({
      where: {
        qrCode: qr,
      },
      include: {
        tickets: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  static async checkIn({ booking_id, checkedInCount }) {
    const booking = await prisma.booking.findUnique({
      where: {
        id: booking_id,
      },
      include: {
        tickets: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (checkedInCount + booking.numVerifiedAtVenue > booking.tickets.length) {
      throw new Error("Invalid check-in count");
    }

    await prisma.booking.update({
      where: {
        id: booking_id,
      },
      data: {
        numVerifiedAtVenue: {
          increment: checkedInCount,
        },
      },
    });

    return booking;
  }
}

export default BookingService;
