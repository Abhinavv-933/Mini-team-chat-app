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
    const { user, token, logout } = useAuthStore();
    const socket = useSocket();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            router.push('/auth/login');
            return;
        }

        loadChannels();
    }, [token, router]);

    useEffect(() => {
        if (!socket || !token) return;

        // Fetch initial online users when socket connects
        const fetchOnlineUsers = async () => {
            try {
                const data = await api.fetchWithAuth('/api/presence/online', token);
                const onlineUsersMap: Record<string, boolean> = {};
                data.onlineUsers.forEach((userId: string) => {
                    onlineUsersMap[userId] = true;
                });
                setOnlineUsers(onlineUsersMap);
            } catch (error) {
                console.error('Failed to fetch online users:', error);
            }
        };

        fetchOnlineUsers();

        // Listen for new messages - don't filter by activeChannel here
        socket.on('new_message', (message: Message) => {
            console.log('Received message:', message);
            // Only add message if it's for the currently active channel
            setMessages((prev) => {
                // Check if this message is for the current channel
                const currentChannelId = activeChannel?.id;
                if (message.channelId === currentChannelId) {
                    // Check if message already exists (avoid duplicates)
                    if (prev.some(m => m.id === message.id)) {
                        return prev;
                    }
                    return [...prev, message];
                }
                return prev;
            });
        });

        socket.on('presence_update', ({ userId, online }: { userId: string; online: boolean }) => {
            console.log('Presence update:', userId, online);
            setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
        });

        return () => {
            socket.off('new_message');
            socket.off('presence_update');
        };
    }, [socket, token, activeChannel]);

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

    const selectChannel = async (channel: Channel) => {
        setActiveChannel(channel);
        setMessages([]);

        if (socket) {
            socket.emit('join_channel', channel.id);
        }

        try {
            const data = await api.fetchWithAuth(`/api/messages/${channel.id}?limit=50`, token!);
            setMessages(data.reverse());
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSendMessage = (content: string) => {
        if (!socket || !activeChannel) return;

        socket.emit('send_message', {
            channelId: activeChannel.id,
            content,
        });
    };

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

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

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Channel Sidebar */}
                <ChannelList
                    channels={channels}
                    activeChannel={activeChannel}
                    onSelectChannel={selectChannel}
                    onChannelCreated={loadChannels}
                />

                {/* Messages Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {activeChannel ? (
                        <>
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-xl font-semibold text-gray-800">#{activeChannel.name}</h2>
                                {activeChannel.description && (
                                    <p className="text-sm text-gray-500">{activeChannel.description}</p>
                                )}
                            </div>
                            <MessageList messages={messages} />
                            <MessageInput onSendMessage={handleSendMessage} />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a channel to start chatting
                        </div>
                    )}
                </div>

                {/* Online Users Sidebar */}
                <OnlineUsers
                    channelId={activeChannel?.id}
                    onlineUsers={onlineUsers}
                />
            </div>
        </div>
    );
}
