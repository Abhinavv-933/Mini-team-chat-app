import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getChannels = async (req: Request, res: Response) => {
    try {
        const channels = await prisma.channel.findMany({
            include: {
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createChannel = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        // @ts-ignore
        const userId = req.user?.userId;

        const existingChannel = await prisma.channel.findUnique({ where: { name } });
        if (existingChannel) {
            return res.status(400).json({ message: 'Channel name already taken' });
        }

        const channel = await prisma.channel.create({
            data: {
                name,
                description,
                members: {
                    create: { userId }
                }
            }
        });

        res.status(201).json(channel);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getChannelById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const channel = await prisma.channel.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true }
                        }
                    }
                }
            }
        });

        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        res.json(channel);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const joinChannel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.userId;

        const existingMember = await prisma.channelMember.findUnique({
            where: {
                userId_channelId: {
                    userId,
                    channelId: id
                }
            }
        });

        if (existingMember) {
            return res.status(400).json({ message: 'Already a member' });
        }

        await prisma.channelMember.create({
            data: {
                userId,
                channelId: id
            }
        });

        res.json({ message: 'Joined channel' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const leaveChannel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.userId;

        await prisma.channelMember.delete({
            where: {
                userId_channelId: {
                    userId,
                    channelId: id
                }
            }
        });

        res.json({ message: 'Left channel' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
