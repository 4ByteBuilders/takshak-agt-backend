import { Router } from "express";
import PolicyController from "../controllers/policy.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
const router = Router();

router.post("/create", authMiddleware, PolicyController.createMessage);
export default router;