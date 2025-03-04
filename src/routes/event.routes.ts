import { Router } from "express";
import EventController from "../controllers/event.controller";

const router = Router();

// REMOVE THIS  ROUTE, CONTROLLER, & SERVICE AFTER FUNCTIONALITY IMPLEMENTED IN ADMIN ROUTE
router.post("/create", EventController.create);

router.get("/get-latest", EventController.getLatestEvent);

export default router;
