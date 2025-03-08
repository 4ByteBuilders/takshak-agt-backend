import {Router} from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import UserController from '../controllers/user.controller';

const router = Router();

router.post('/create', authMiddleware, UserController.create);

export default router;