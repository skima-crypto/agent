'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src="/714.jpg"
        alt="background"
        fill
        className="object-cover brightness-50"
        priority
      />

      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
        <h1 className="text-5xl font-bold mb-4">Welcome to <span className="text-blue-400">714 Chat</span></h1>
        <p className="text-lg mb-8 max-w-lg text-gray-200">
          Connect, laugh, and chat with people around the world.  
          Tip your friends, share gifs, and vibe in real-time 🔥
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition"
          >
            Login / Signup
          </button>
          <button
            onClick={() => router.push('/chat')}
            className="bg-white text-blue-600 hover:bg-gray-200 px-6 py-3 rounded-xl font-semibold shadow-lg transition"
          >
            Enter Chat
          </button>
        </div>
      </div>
    </div>
  )
}
