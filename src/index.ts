import dotenv from "dotenv";
import express from "express";
import eventRouter from "./routes/event.routes";
import policyRouter from "./routes/policy.routes";
import bookingRouter from "./routes/booking.routes";
import adminRouter from "./routes/admin.routes";
import { errorHandler } from "./middlewares/error.middleware";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/event", eventRouter);
app.use("/policy", policyRouter);
app.use("/booking", bookingRouter);
app.use("/admin", adminRouter);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Live on http://localhost:${PORT}`);
});