import { Router } from "express";
import { authMiddlewareAdmin } from "../middlewares/auth.middleware";
import AdminController from "../controllers/admin.controller";

const router = Router();

router.post("/check-admin", authMiddlewareAdmin, AdminController.checkAdmin);
router.get("/all-events", authMiddlewareAdmin, AdminController.getAllEvents);
router.get("/all-messages", authMiddlewareAdmin, AdminController.getAllMessages);
router.put("/change-message-status", authMiddlewareAdmin, AdminController.changeMessageStatus);
router.post("/create-event", authMiddlewareAdmin, AdminController.createEvent);
router.delete("/delete-event", authMiddlewareAdmin, AdminController.deleteEvent);

export default router;