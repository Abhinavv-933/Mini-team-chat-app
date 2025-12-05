'use client';

import { useEffect, useRef } from 'react';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
    };
}

interface MessageListProps {
    messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                    No messages yet. Start the conversation!
                </div>
            ) : (
                messages.map((message, index) => {
                    const showUsername = index === 0 || messages[index - 1].user.id !== message.user.id;

                    return (
                        <div key={message.id} className={showUsername ? 'mt-4' : 'mt-1'}>
                            {showUsername && (
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-semibold text-gray-800">{message.user.username}</span>
                                    <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                                </div>
                            )}
                            <div className="text-gray-700 pl-0">{message.content}</div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}
