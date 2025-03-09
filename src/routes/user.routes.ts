import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import UserController from '../controllers/user.controller';

const router = Router();

router.post('/create', authMiddleware, UserController.create);
router.get('/check-number', authMiddleware, UserController.checkNumber);
router.put('/update-phone', authMiddleware, UserController.updatePhone);
export default router;