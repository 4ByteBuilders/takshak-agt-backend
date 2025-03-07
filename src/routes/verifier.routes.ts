import { Router } from "express";
import { authMiddlewareVerifiers } from "../middlewares/auth.middleware";
import VerifierController from "../controllers/verifier.controller";

const router = Router();

router.post("/booking", authMiddlewareVerifiers, VerifierController.verifyBooking);
router.post("/check-in", authMiddlewareVerifiers, VerifierController.checkIn);

export default router;