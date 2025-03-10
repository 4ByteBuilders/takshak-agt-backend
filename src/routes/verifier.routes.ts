import { Router } from "express";
import { authMiddlewareAdmin, authMiddlewareVerifiers } from "../middlewares/auth.middleware";
import VerifierController from "../controllers/verifier.controller";

const router = Router();

router.get("/", authMiddlewareAdmin, VerifierController.getAll);
router.post("/add", authMiddlewareAdmin, VerifierController.addVerifier);
router.delete("/remove", authMiddlewareAdmin, VerifierController.removeVerifier);
router.post("/booking", authMiddlewareVerifiers, VerifierController.verifyBooking);
router.post("/check-in", authMiddlewareVerifiers, VerifierController.checkIn);

export default router;