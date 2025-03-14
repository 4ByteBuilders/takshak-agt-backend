import { Router } from "express";
import EventController from "../controllers/event.controller";
import { authMiddlewareAdmin } from "../middlewares/auth.middleware";

const router = Router();

// REMOVE THIS  ROUTE, CONTROLLER, & SERVICE AFTER FUNCTIONALITY IMPLEMENTED IN ADMIN ROUTE
router.post("/create", EventController.create);

router.get("/get-latest", EventController.getLatestEvent);

router.get("/get-available-tickets", EventController.getAvailableTickets);

export default router;
