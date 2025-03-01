import { Router } from "express";
import EventController from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/create", EventController.create);
export default router;