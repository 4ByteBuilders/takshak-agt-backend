import { Router } from "express";
import EventController from "../controllers/event.controller";

const router = Router();

router.post("/create", EventController.create);

export default router;
