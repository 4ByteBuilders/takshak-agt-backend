import { Router } from "express";
import EventController from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/create", EventController.create);
// To Do: Get Details of latest Event without ticket
router.get("/get-latest", EventController.getLatestEvent);

export default router;
