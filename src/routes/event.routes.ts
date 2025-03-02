import { Router } from "express";
import EventController from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// REMOVE THIS  ROUTE, CONTROLLER, & SERVICE AFTER FUNCTIONALITY IMPLEMENTED IN ADMIN ROUTE
router.post("/create", EventController.create);

router.get("/get-latest", authMiddleware, EventController.getLatestEvent);

export default router;
