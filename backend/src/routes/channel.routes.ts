import { Router } from 'express';
import { getChannels, createChannel, getChannelById, joinChannel, leaveChannel } from '../controllers/channel.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getChannels);
router.post('/', createChannel);
router.get('/:id', getChannelById);
router.post('/:id/join', joinChannel);
router.post('/:id/leave', leaveChannel);

export default router;
