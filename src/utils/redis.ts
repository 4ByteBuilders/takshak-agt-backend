import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import prisma from "./prisma";

const redisClient = new Redis(process.env.REDIS_URL);
const redisSubsriber = new Redis(process.env.REDIS_URL);
redisSubsriber.subscribe("__keyevent@0__:expired", (err) => {
  if (err) {
    console.error("Failed to subscribe: ", err);
  } else {
    console.log("Subscribed to expired events channel");
  }
});

redisSubsriber.on("message", async (channel, message) => {
  if (channel === "__keyevent@0__:expired") {
    console.log(`Key expired: ${message}`);
    const msg = message.split(":");
    const bookingId = msg[1];
    const ticketId = msg[2];
    try {
      await prisma.$transaction(async (prisma) => {
        await prisma.booking.update({
          where: {
            id: bookingId,
            NOT: { paymentStatus: "PAID" },
          },
          data: { paymentStatus: "EXPIRED" },
        });
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "AVAILABLE" },
        });
      });

    } catch (err) {
      console.error("Failed to update status for", bookingId);
    }
  }
});
export default redisClient;
