import dotenv from "dotenv";
dotenv.config();

import eventRouter from "./routes/event.routes";
import policyRouter from "./routes/policy.routes";
import bookingRouter from "./routes/booking.routes";
import adminRouter from "./routes/admin.routes";
import userRouter from "./routes/user.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { User } from "@supabase/supabase-js";
import cron from "node-cron";
import updateExpiredBookings from "./cronJobs/updateExpiredBookings";
import cors from "cors";
import express, { Request, Response } from 'express';
import verifyRouter from "./routes/verifier.routes";



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
  res.send("Takshak Event Management");
});

app.use("/event", eventRouter);
app.use("/policy", policyRouter);
app.use("/booking", bookingRouter);
app.use("/admin", adminRouter);
app.use("/verify", verifyRouter);
app.use("/user", userRouter);
app.use(errorHandler);

cron.schedule('*/10 * * * *', async () => {
  await updateExpiredBookings();
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});