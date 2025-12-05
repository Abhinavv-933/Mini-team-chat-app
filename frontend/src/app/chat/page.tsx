'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';

import ChannelList from '@/components/ChannelList';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import OnlineUsers from '@/components/OnlineUsers';

interface Channel {
    id: string;
    name: string;
    description?: string;
    _count?: { members: number };
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    channelId: string;
    user: {
        id: string;
        username: string;
    };
}

export default function ChatPage() {
    const router = useRouter();
    const { user, token, logout, restoreUser, loading: authLoading } = useAuthStore();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    // ----------------------------------------------------------------
    // Restore session ONCE at app load
    // ----------------------------------------------------------------
    useEffect(() => {
        restoreUser();
    }, []);

    // ----------------------------------------------------------------
    // SOCKET: ALL REAL-TIME EVENTS
    // ----------------------------------------------------------------
    const socket = useSocket({
        onNewMessage: (message) => {
            if (message.channelId !== activeChannel?.id) return;

            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        },

        onChannelHistory: ({ channelId, messages }) => {
            if (channelId === activeChannel?.id) {
                setMessages(messages);
            }
        },

        onPresenceUpdate: ({ userId, online }) => {
            setOnlineUsers(prev => ({
                ...prev,
                [userId]: online
            }));
        },

        onUserTyping: ({ userId, isTyping, channelId }) => {
            if (channelId !== activeChannel?.id) return;

            setTypingUsers(prev => ({
                ...prev,
                [userId]: isTyping
            }));
        }
    });

    // ----------------------------------------------------------------
    // LOAD CHANNELS AFTER AUTH RESTORED
    // ----------------------------------------------------------------
    useEffect(() => {
        if (authLoading) return; // wait until restoreUser() completes

        if (!token) {
            router.push('/auth/login');
            return;
        }

        loadChannels();
    }, [authLoading, token]);

    const loadChannels = async () => {
        try {
            const data = await api.fetchWithAuth('/api/channels', token!);
            setChannels(data);

            if (data.length > 0 && !activeChannel) {
                selectChannel(data[0]);
            }
        } catch (error) {
            console.error('Failed to load channels:', error);
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------
    // SELECT CHANNEL
    // ----------------------------------------------------------------
    const selectChannel = (channel: Channel) => {
        setActiveChannel(channel);
        setMessages([]);
        setTypingUsers({}); // reset typing
        socket?.emit("join_channel", channel.id);
    };

    // ----------------------------------------------------------------
    // SEND MESSAGE
    // ----------------------------------------------------------------
    const handleSendMessage = (content: string) => {
        if (!socket || !activeChannel) return;

        socket.emit("send_message", {
            channelId: activeChannel.id,
            content
        });
    };

    // ----------------------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------------------
    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    // ----------------------------------------------------------------
    // SHOW LOADING UNTIL:
    // - authStore restored session
    // - channels loaded
    // ----------------------------------------------------------------
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    // ----------------------------------------------------------------
    // RENDER UI
    // ----------------------------------------------------------------
    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Mini Team Chat</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.username}</span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* CHANNELS SIDEBAR */}
                <ChannelList
                    channels={channels}
                    activeChannel={activeChannel}
                    onSelectChannel={selectChannel}
                    onChannelCreated={loadChannels}
                />

                {/* MAIN CHAT AREA */}
                <div className="flex-1 flex flex-col bg-white">
                    {activeChannel ? (
                        <>
                            {/* Channel header */}
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    #{activeChannel.name}
                                </h2>
                                {activeChannel.description && (
                                    <p className="text-sm text-gray-500">
                                        {activeChannel.description}
                                    </p>
                                )}
                            </div>

                            {/* Messages */}
                            <MessageList messages={messages} />

                            {/* Typing indicator */}
                            <div className="px-6 py-1 h-5 text-sm text-gray-500">
                                {Object.entries(typingUsers)
                                    .filter(([id, isTyping]) => isTyping && id !== user?.id)
                                    .map(([id]) => (
                                        <div key={id}>{id} is typing…</div>
                                    ))}
                            </div>

                            {/* Message Input */}
                            <MessageInput
                                onSendMessage={handleSendMessage}
                                socket={socket}
                                channelId={activeChannel.id}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a channel to start chatting
                        </div>
                    )}
                </div>

                {/* ONLINE USERS SIDEBAR */}
                <OnlineUsers
                    channelId={activeChannel?.id}
                    onlineUsers={onlineUsers}
                />
            </div>
        </div>
    );
}
