"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send } from "lucide-react";

interface VoiceRecorderProps {
  onRecorded: (file: File) => void;
}

export default function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (recording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => chunks.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: "audio/webm" });
          chunks.current = [];
          const url = URL.createObjectURL(blob);
          setAudioURL(url);
          const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
          onRecorded(file);
        };
        recorder.start();
        setMediaRecorder(recorder);
      });
    } else {
      mediaRecorder?.stop();
    }
    return () => {
      mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [recording]);

  return (
    <div className="flex items-center space-x-2">
      {!recording ? (
        <button
          onClick={() => setRecording(true)}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          <Mic className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={() => setRecording(false)}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
        >
          <Square className="w-5 h-5" />
        </button>
      )}

      {audioURL && (
        <audio controls src={audioURL} className="rounded-md" preload="metadata" />
      )}
    </div>
  );
}
