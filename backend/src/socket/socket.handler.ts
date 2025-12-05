import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

export const setupSocket = (io: Server) => {
    io.use(async (socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string };
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket: AuthenticatedSocket) => {
        const userId = socket.userId!;
        console.log(`User connected: ${userId}`);

        // Update presence
        await prisma.presence.upsert({
            where: { socketId: socket.id },
            update: { online: true, lastSeen: new Date() },
            create: {
                userId,
                socketId: socket.id,
                online: true
            }
        });

        // Broadcast user online
        socket.broadcast.emit('presence_update', { userId, online: true });

        socket.on('join_channel', (channelId: string) => {
            socket.join(`channel:${channelId}`);
            console.log(`User ${userId} joined channel ${channelId}`);
        });

        socket.on('leave_channel', (channelId: string) => {
            socket.leave(`channel:${channelId}`);
            console.log(`User ${userId} left channel ${channelId}`);
        });

        socket.on('send_message', async (data: { channelId: string; content: string }) => {
            try {
                const { channelId, content } = data;

                // Save message to DB
                const message = await prisma.message.create({
                    data: {
                        content,
                        userId,
                        channelId
                    },
                    include: {
                        user: {
                            select: { id: true, username: true }
                        }
                    }
                });

                // Broadcast to channel
                io.to(`channel:${channelId}`).emit('new_message', message);
            } catch (error) {
                console.error('Send message error:', error);
            }
        });

        socket.on('typing', (data: { channelId: string; isTyping: boolean }) => {
            socket.to(`channel:${data.channelId}`).emit('user_typing', {
                userId,
                isTyping: data.isTyping,
                channelId: data.channelId
            });
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${userId}`);

            // Remove presence record for this socket
            await prisma.presence.deleteMany({
                where: { socketId: socket.id }
            });

            // Check if user has other active connections
            const activeConnections = await prisma.presence.count({
                where: { userId, online: true }
            });

            if (activeConnections === 0) {
                socket.broadcast.emit('presence_update', { userId, online: false, lastSeen: new Date() });
            }
        });
    });
};
