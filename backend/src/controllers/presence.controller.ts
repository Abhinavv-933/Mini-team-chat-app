import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getOnlineUsers = async (req: Request, res: Response) => {
    try {
        // Get all users with at least one active presence
        const onlinePresences = await prisma.presence.findMany({
            where: { online: true },
            select: { userId: true },
            distinct: ['userId']
        });

        const onlineUserIds = onlinePresences.map(p => p.userId);

        res.json({ onlineUsers: onlineUserIds });
    } catch (error) {
        console.error('Get online users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
