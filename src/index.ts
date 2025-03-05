import dotenv from "dotenv";
import eventRouter from "./routes/event.routes";
import policyRouter from "./routes/policy.routes";
import bookingRouter from "./routes/booking.routes";
import adminRouter from "./routes/admin.routes";
import { errorHandler } from "./middlewares/error.middleware";
import cors from "cors";
import express, { Request, Response, NextFunction } from 'express';

dotenv.config();

import { User } from "@supabase/supabase-js";
import cron from "node-cron";
import updateExpiredBookings from "./cronJobs/updateExpiredBookings";
import logger from "./utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
    }
  }
}

const app = express();
app.use(express.json({
  verify: (req: Request & { rawBody?: string }, res: Response, buf: Buffer, encoding: BufferEncoding) => {
    req.rawBody = buf.toString(encoding);
  }
}));

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/event", eventRouter);
app.use("/policy", policyRouter);
app.use("/booking", bookingRouter);
app.use("/admin", adminRouter);
app.use(errorHandler);

cron.schedule('*/10 * * * *', async () => {
  logger.info((`[${new Date().toISOString()}] Running cron job to update expired bookings...`).toString());
  await updateExpiredBookings();
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Live on http://localhost:${PORT}`);
});