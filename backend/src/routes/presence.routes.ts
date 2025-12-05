import { Router } from 'express';
import { getOnlineUsers } from '../controllers/presence.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/online', getOnlineUsers);

export default router;
