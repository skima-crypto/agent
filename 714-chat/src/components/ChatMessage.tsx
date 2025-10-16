"use client";

import React from "react";

interface ChatMessageProps {
  message: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    type: "text" | "image" | "audio";
    timestamp: string;
    isOwn: boolean;
  };
  onImageClick?: (url: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onImageClick }) => {
  const { content, type, isOwn, senderName, timestamp } = message;

  return (
    <div
      className={`flex w-full my-2 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm border ${
          isOwn
            ? "bg-blue-500 text-white border-blue-400"
            : "bg-white text-gray-800 border-gray-200"
        }`}
      >
        {/* Sender Name */}
        {!isOwn && (
          <p className="text-sm font-semibold text-blue-600 mb-1">
            {senderName}
          </p>
        )}

        {/* Message Content */}
        {type === "text" && (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        )}

        {type === "image" && (
          <img
            src={content}
            alt="uploaded"
            className="rounded-xl mt-1 cursor-pointer hover:opacity-90 transition"
            onClick={() => onImageClick?.(content)}
          />
        )}

        {type === "audio" && (
          <audio
            controls
            className="mt-2 w-full focus:outline-none accent-blue-500"
          >
            <source src={content} type="audio/mpeg" />
          </audio>
        )}

        {/* Timestamp */}
        <span
          className={`text-[10px] block mt-1 text-right ${
            isOwn ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
