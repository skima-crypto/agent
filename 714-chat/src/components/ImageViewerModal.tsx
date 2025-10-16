"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ImageViewerModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  imageUrl,
  onClose,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl max-h-[85vh] w-full mx-4 bg-white rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full view"
          className="max-h-[80vh] w-auto object-contain rounded-xl"
        />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ImageViewerModal;
