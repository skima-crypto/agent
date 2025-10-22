"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Reply, Copy, Trash2 } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

interface MessageActionsPopupProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function MessageActionsPopup({
  visible,
  x,
  y,
  onClose,
  onReact,
  onReply,
  onCopy,
  onDelete,
  showDelete = false,
}: MessageActionsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-2 w-48"
          style={{ top: y, left: x }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Message actions
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={onReply}
              className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Reply className="w-4 h-4 mr-2" /> Reply
            </button>

            <button
              onClick={onCopy}
              className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy
            </button>

            {showDelete && (
              <button
                onClick={onDelete}
                className="flex items-center w-full px-2 py-1.5 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            <div className="flex items-center justify-between mb-1">
              <Smile className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">React</span>
            </div>
            <EmojiPicker
              searchDisabled
              previewConfig={{ showPreview: false }}
              width="100%"
              height={200}
              onEmojiClick={(e) => {
  onReact(e.emoji);
  onClose();
}}

            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
