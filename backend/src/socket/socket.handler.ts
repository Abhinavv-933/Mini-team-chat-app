import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

export const setupSocket = (io: Server) => {
    // 🔹 Auth middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) return next(new Error("Authentication error"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    // 🔹 Connection
    io.on("connection", async (socket: AuthenticatedSocket) => {
        const userId = socket.userId!;
        console.log(`User connected: ${userId}`);

        // Mark socket online
        await prisma.presence.upsert({
            where: { socketId: socket.id },
            update: { online: true, lastSeen: new Date() },
            create: { userId, socketId: socket.id, online: true }
        });

        // Broadcast online status
        socket.broadcast.emit("presence_update", { userId, online: true });

        // 🔹 Join channel
        socket.on("join_channel", async (channelId: string) => {
            socket.join(`channel:${channelId}`);
            console.log(`User ${userId} joined channel ${channelId}`);

            // Send message history
            const messages = await prisma.message.findMany({
                where: { channelId },
                orderBy: { createdAt: "asc" },
                include: {
                    user: { select: { id: true, username: true } }
                }
            });

            socket.emit("channel_history", { channelId, messages });
        });

        // 🔹 Leave channel
        socket.on("leave_channel", (channelId: string) => {
            socket.leave(`channel:${channelId}`);
            console.log(`User ${userId} left channel ${channelId}`);
        });

        // 🔹 Real-time send message
        socket.on("send_message", async ({ channelId, content }) => {
            try {
                const message = await prisma.message.create({
                    data: { content, userId, channelId },
                    include: {
                        user: { select: { id: true, username: true } }
                    }
                });

                io.to(`channel:${channelId}`).emit("new_message", message);
            } catch (error) {
                console.error("Send message error:", error);
            }
        });

        // 🔹 Typing indicator
        socket.on("typing", ({ channelId, isTyping }) => {
            socket.to(`channel:${channelId}`).emit("user_typing", {
                userId,
                isTyping,
                channelId
            });
        });

        // 🔹 Disconnect (Fixed)
        socket.on("disconnect", async () => {
            console.log(`User disconnected: ${userId}`);

            // Mark this socket offline instead of deleting
            await prisma.presence.updateMany({
                where: { socketId: socket.id },
                data: { online: false, lastSeen: new Date() }
            });

            // Check if user still has active connections
            const activeConnections = await prisma.presence.count({
                where: { userId, online: true }
            });

            // If user fully offline → broadcast
            if (activeConnections === 0) {
                socket.broadcast.emit("presence_update", {
                    userId,
                    online: false,
                    lastSeen: new Date()
                });
            }
        });
    });
};
