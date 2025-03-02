import dotenv from "dotenv";
import express from "express";
import eventRouter from "./routes/event.routes";
import policyRouter from "./routes/policy.routes";
import bookingRouter from "./routes/booking.routes";
import { errorHandler } from "./middlewares/error.middleware";
import cors from "cors";
console.log("Hello world");
dotenv.config();
console.log(process.env.DATABASE_URL);
console.log(process.env.PORT);
console.log(process.env.REDIS_URL);
console.log(process.env.SUPABASE_URL);
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/event", eventRouter);
app.use("/policy", policyRouter);
app.use("/booking", bookingRouter);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Live on http://localhost:${PORT}`);
});
