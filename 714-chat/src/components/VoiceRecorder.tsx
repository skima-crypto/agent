"use client"
import React, { useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";

type Props = {
  onRecorded: (file: File) => void;
};

export default function VoiceRecorder({ onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSupported(false);
    }
    // cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSupported(false);
      alert("Recording not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const options: MediaRecorderOptions = { mimeType: "audio/webm" };
      const mediaRecorder = new MediaRecorder(stream, options);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `${Date.now()}.webm`, { type: "audio/webm" });
        onRecorded(file);
        // stop tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        setRecording(false);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (err: any) {
      console.error("Microphone permission denied or error:", err);
      alert("Microphone access was denied. Please allow microphone permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setRecording(false);
    }
  };

  if (!supported) {
    return (
      <div className="p-2 rounded-full">
        <Mic className="text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {!recording ? (
        <button
          type="button"
          onClick={startRecording}
          className="p-2 rounded-full hover:bg-blue-900/40"
          aria-label="Start recording"
        >
          <Mic className="text-blue-300" />
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
          aria-label="Stop recording"
        >
          Stop
        </button>
      )}
    </div>
  );
}
