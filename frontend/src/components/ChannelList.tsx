'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface Channel {
    id: string;
    name: string;
    description?: string;
    _count?: { members: number };
}

interface ChannelListProps {
    channels: Channel[];
    activeChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onChannelCreated: () => void;
}

export default function ChannelList({
    channels,
    activeChannel,
    onSelectChannel,
    onChannelCreated,
}: ChannelListProps) {
    const { token } = useAuthStore();
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.fetchWithAuth('/api/channels', token!, {
                method: 'POST',
                body: JSON.stringify({ name, description }),
            });

            setName('');
            setDescription('');
            setShowModal(false);
            onChannelCreated();
        } catch (err: any) {
            setError(err.message || 'Failed to create channel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold mb-3">Channels</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition font-medium"
                    >
                        + Create Channel
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {channels.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition ${activeChannel?.id === channel.id ? 'bg-gray-700 border-l-4 border-indigo-500' : ''
                                }`}
                        >
                            <div className="font-medium"># {channel.name}</div>
                            {channel._count && (
                                <div className="text-xs text-gray-400">{channel._count.members} members</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create Channel Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Create New Channel</h3>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateChannel} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Channel Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                                    placeholder="general"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                                    placeholder="What's this channel about?"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
