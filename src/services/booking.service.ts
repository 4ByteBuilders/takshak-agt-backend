import prisma from "../utils/prisma";
import { v4 as uuidv4 } from "uuid";
import { Cashfree } from "cashfree-pg";
import { getCurrentDateFormatted } from "../utils/dateUtils";
import { PaymentStatus } from "@prisma/client";
import redisClient from "../utils/redis";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

class BookingService {
  static getRemainingTickets = async () => {
    const lockedTickets = await redisClient.keys(`locked_ticket:*`);
    const lockedTicketIds = lockedTickets.map((key) =>
      key.split(":").pop()
    );

    // ONLY WORKS FOR SINGLE EVENT
    const event = await prisma.event.findFirst({
      include: {
        tickets: {
          where: {
            status: "AVAILABLE",
            id: {
              notIn: lockedTicketIds,
            }
          }
        }
      },
    });
    if (!event) return new Error("No Event found!!");
    return { remainingTickets: event.tickets.length };
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
        return_url: `${process.env.FRONTEND_URL}/payment-status?order_id=${order_id}&status={order_status}`,
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

  static getPaymentStatus = async (order_id: string) => {
    const orderResponse = await Cashfree.PGOrderFetchPayments("2023-08-01", order_id).then((response) => {
      return response.data;
    }).catch((error) => {
      console.log(error);
      return { status: false, error: 'Error fetching payment status' };
    });

    console.log(orderResponse);
    return orderResponse;
  }

  static updatePaymentStatus = async ({ signature, body, timestamp }) => {
    try {
      Cashfree.PGVerifyWebhookSignature(signature, body, timestamp);
    } catch (err) {
      console.log(err.message)
      throw new Error('Invalid Signature');
    }
  }

  static confirmOrder = async (bookingId: string) => {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { tickets: true },
      });

      if (!booking) {
        throw new Error("Booking not found!!");
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: "PAID" },
      });

      return { ...booking, paymentStatus: "PAID" };
    });
  };

  static getOrder = async (order_id: string) => {
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
        paymentStatus: PaymentStatus.PAID
      },
      include: {
        tickets: true,
        event: {
          include: {
            priceOfferings: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enrichedBookings = bookings.map((booking) => {
      const priceOfferingSelected = JSON.parse(booking.priceOfferingSelected as string);

      const priceDetails = Object.entries(priceOfferingSelected).map(([id, quantity]) => {
        const offering = booking.event.priceOfferings.find((offer) => offer.id === id);
        return offering
          ? { name: offering.name, price: offering.price, quantity }
          : { name: "Unknown", price: 0, quantity };
      });

      return {
        ...booking,
        priceDetails,
      };
    });

    return enrichedBookings;
  }

  static async getPendingBookings({ userId, eventId }) {
    const sixteenMinutesAgo = new Date();
    sixteenMinutesAgo.setMinutes(sixteenMinutesAgo.getMinutes() - 16);

    const whereCondition = {
      userId,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: { gte: sixteenMinutesAgo },
      ...(eventId ? { eventId } : {}),
    };

    const bookings = eventId
      ? await prisma.booking.findFirst({
        where: whereCondition,
        include: {
          event: {
            include: {
              priceOfferings: true,
            },
          },
          tickets: true,
        },
        orderBy: { createdAt: "desc" },
      })
      : await prisma.booking.findMany({
        where: whereCondition,
        include: {
          event: {
            include: {
              priceOfferings: true,
            },
          },
          tickets: true,
        },
        orderBy: { createdAt: "desc" },
      });

    if (!bookings) return null;


    const pendingBookings = Array.isArray(bookings) ? bookings : [bookings];


    const enrichedBookings = pendingBookings.map((booking) => {
      const priceOfferingSelected = JSON.parse(booking.priceOfferingSelected as string);

      const priceDetails = Object.entries(priceOfferingSelected).map(([id, quantity]) => {
        const offering = booking.event.priceOfferings.find((offer) => offer.id === id);
        return offering
          ? { name: offering.name, price: offering.price, quantity: quantity as number }
          : { name: "Unknown", price: 0, quantity: quantity as number };
      });

      return {
        ...booking,
        priceDetails,
      };
    });

    return eventId ? enrichedBookings[0] : enrichedBookings;
  }


  static async verifyBooking({ qr }) {
    const booking = await prisma.booking.findUnique({
      where: {
        qrCode: qr,
        paymentStatus: "PAID",
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
    console.log(checkedInCount);
    console.log(booking.numVerifiedAtVenue);
    console.log(booking.tickets.length);
    const checkedInCountNumber = Number(checkedInCount);
    if (
      checkedInCountNumber + booking.numVerifiedAtVenue >
      booking.tickets.length
    ) {
      throw new Error("Invalid check-in count");
    }

    await prisma.booking.update({
      where: {
        id: booking_id,
      },
      data: {
        numVerifiedAtVenue: {
          increment: checkedInCountNumber,
        },
      },
    });
    booking.numVerifiedAtVenue += checkedInCountNumber;
    return booking;
  }
}

export default BookingService;