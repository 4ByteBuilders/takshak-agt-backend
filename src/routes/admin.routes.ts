import { Router } from "express";
import { authMiddlewareAdmin } from "../middlewares/auth.middleware";
import AdminController from "../controllers/admin.controller";

const router = Router();

router.post("/create", authMiddlewareAdmin, AdminController.create);

export default router;