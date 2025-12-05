"use client";

import { useState, KeyboardEvent, useRef } from "react";

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    socket?: any;               // optional for typing indicator
    channelId?: string | null;  // optional for typing indicator
    userId?: string;            // optional to prevent showing “you” as typing
}

export default function MessageInput({ onSendMessage, socket, channelId }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const typingTimeoutRef = useRef<any>(null);
    const isTypingRef = useRef(false);

    // -----------------------------
    // TYPING INDICATOR
    // -----------------------------
    const emitTyping = (isTyping: boolean) => {
        if (!socket || !channelId) return;
        socket.emit("typing", { channelId, isTyping });
    };

    const handleTyping = (value: string) => {
        setMessage(value);

        if (!socket || !channelId) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            emitTyping(true);
        }

        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            emitTyping(false);
        }, 1000);
    };

    // -----------------------------
    // SEND MESSAGE
    // -----------------------------
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim().length === 0) return;

        onSendMessage(message.trim());
        setMessage("");

        // Stop typing indicator
        emitTyping(false);
        isTypingRef.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 bg-gray-900">
            <div className="flex gap-3">
                <textarea
                    value={message}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    className="
                        flex-1 px-4 py-3 
                        bg-gray-800 
                        text-white 
                        border border-gray-700 
                        rounded-lg 
                        focus:ring-2 focus:ring-indigo-500 
                        outline-none resize-none
                        placeholder-gray-400
                    "
                    rows={1}
                />

                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="
                        px-6 py-3 
                        bg-indigo-600 text-white 
                        rounded-lg 
                        hover:bg-indigo-700 transition 
                        disabled:opacity-50 
                        disabled:cursor-not-allowed 
                        font-semibold
                    "
                >
                    Send
                </button>
            </div>
        </form>
    );
}
