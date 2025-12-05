'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface User {
    id: string;
    username: string;
}

interface OnlineUsersProps {
    channelId?: string;
    onlineUsers: Record<string, boolean>;
}

export default function OnlineUsers({ channelId, onlineUsers }: OnlineUsersProps) {
    const { token } = useAuthStore();
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        if (!token) return;

        const loadAllUsers = async () => {
            try {
                // Fetch all users from the system
                const channelsData = await api.fetchWithAuth('/api/channels', token);

                // Get unique users from all channels
                const usersMap = new Map<string, User>();

                for (const channel of channelsData) {
                    const channelDetail = await api.fetchWithAuth(`/api/channels/${channel.id}`, token);
                    channelDetail.members.forEach((m: any) => {
                        if (!usersMap.has(m.user.id)) {
                            usersMap.set(m.user.id, m.user);
                        }
                    });
                }

                setAllUsers(Array.from(usersMap.values()));
                console.log('All users loaded:', Array.from(usersMap.values()));
                console.log('Online users:', onlineUsers);
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        };

        loadAllUsers();
    }, [token, onlineUsers]);

    const onlineUsersList = allUsers.filter(u => onlineUsers[u.id]);
    const offlineUsersList = allUsers.filter(u => !onlineUsers[u.id]);

    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-4">
                Online Users ({onlineUsersList.length})
            </h3>
            <div className="space-y-2">
                {onlineUsersList.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">{user.username}</span>
                    </div>
                ))}
                {offlineUsersList.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-gray-500">{user.username}</span>
                    </div>
                ))}
                {allUsers.length === 0 && (
                    <div className="text-gray-500 text-sm">No users yet</div>
                )}
            </div>
        </div>
    );
}
