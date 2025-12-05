import { Router } from 'express';
import { getMessages } from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/:channelId', getMessages);

export default router;
