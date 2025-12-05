import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

export const useSocket = (handlers?: {
    onPresenceUpdate?: (data: any) => void;
    onNewMessage?: (msg: any) => void;
    onChannelHistory?: (payload: any) => void;
    onUserTyping?: (payload: any) => void;
}) => {
    const { token } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        // Avoid duplicate socket creation
        if (socketRef.current) return;

        const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
            auth: { token },
            transports: ["websocket"],
            reconnection: true,
        });

        socketRef.current = socket;

        // SOCKET CONNECT / DISCONNECT LOGS
        socket.on("connect", () => {
            console.log("🔵 Socket connected:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Socket disconnected");
        });

        // LISTENERS BASED ON HANDLERS PASSED IN
        if (handlers?.onPresenceUpdate) {
            socket.on("presence_update", handlers.onPresenceUpdate);
        }

        if (handlers?.onNewMessage) {
            socket.on("new_message", handlers.onNewMessage);
        }

        if (handlers?.onChannelHistory) {
            socket.on("channel_history", handlers.onChannelHistory);
        }

        if (handlers?.onUserTyping) {
            socket.on("user_typing", handlers.onUserTyping);
        }

        return () => {
            console.log("🧹 Cleaning socket…");
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    return socketRef.current;
};
