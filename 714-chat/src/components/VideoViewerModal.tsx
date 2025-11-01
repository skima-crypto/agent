"use client"

import React from "react";
import { X } from "lucide-react";

type VideoViewerModalProps = {
  videoUrl: string;
  onClose: () => void;
};

export default function VideoViewerModal({ videoUrl, onClose }: VideoViewerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-3xl bg-transparent rounded-md overflow-hidden">
        <button
          className="absolute top-3 right-3 z-50 bg-black/40 p-2 rounded-full"
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>

        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="w-full h-auto max-h-[85vh] bg-black"
        />
      </div>
    </div>
  );
}
