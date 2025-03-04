import { Router } from "express";
import { authMiddlewareAdmin } from "../middlewares/auth.middleware";
import AdminController from "../controllers/admin.controller";

const router = Router();

router.post("/check-admin", authMiddlewareAdmin, AdminController.checkAdmin);
router.get("/all-events", authMiddlewareAdmin, AdminController.getAllEvents);
router.post("/create-event", authMiddlewareAdmin, AdminController.createEvent);
router.delete("/delete-event", authMiddlewareAdmin, AdminController.deleteEvent);
export default router;