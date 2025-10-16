'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleGoogleLogin = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback` // dynamic domain
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('Loading...')

    const redirectBase = window.location.origin // dynamic domain

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) setMessage('Error: ' + error.message)
      else {
        setMessage('Account created! Redirecting...')
        window.location.href = `${redirectBase}/profile`
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) setMessage('Error: ' + error.message)
      else window.location.href = `${redirectBase}/chat`
    }
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-blue-600 gap-6">
      <h1 className="text-2xl font-bold mb-4 text-white">Welcome to 714 💬</h1>

      <button
        onClick={handleGoogleLogin}
        className="px-6 py-3 bg-white text-blue-600 rounded-xl shadow-md hover:bg-gray-100 transition"
      >
        Sign in with Google
      </button>

      <div className="flex items-center w-64 justify-center text-gray-300">
        <span className="border-t border-gray-300 flex-grow"></span>
        <span className="px-2 text-sm">or</span>
        <span className="border-t border-gray-300 flex-grow"></span>
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-3 w-64">
        <input
          type="email"
          placeholder="Enter your email"
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Enter password"
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="px-6 py-2 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 transition"
        >
          {isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-sm text-white underline"
      >
        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
      </button>

      {message && <p className="text-sm text-white mt-2">{message}</p>}
    </div>
  )
}
