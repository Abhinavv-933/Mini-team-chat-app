import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { channelId } = req.params;
        const { cursor, limit = 50 } = req.query;

        const messages = await prisma.message.findMany({
            take: Number(limit),
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: String(cursor) } : undefined,
            where: {
                channelId
            },
            include: {
                user: {
                    select: { id: true, username: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Reverse to show oldest first in the UI list (but we fetched newest first)
        // Actually, usually frontend handles this, but let's return them as is (newest first)
        // and frontend can reverse or prepend.

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
