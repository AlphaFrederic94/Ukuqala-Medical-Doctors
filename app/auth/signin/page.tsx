"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just navigate to dashboard
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Sign In Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-xl">U</span>
              </div>
              <span className="text-xl font-semibold">Ukuqala Medicals</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Sign in</h1>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-muted border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-muted border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-muted-foreground text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-foreground">
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full py-3 bg-foreground text-background font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/auth/signup" className="text-foreground font-semibold hover:underline">
              Sign up
            </Link>
          </div>

          {/* Forgot Password */}
          <div className="mt-2 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
              Forgot Password
            </Link>
          </div>

          {/* Social Login */}
          <div className="mt-8">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="w-12 h-12 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="Sign in with Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="w-12 h-12 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="Sign in with GitHub"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </button>

              <button
                type="button"
                className="w-12 h-12 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="Sign in with Facebook"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Promotional Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] relative overflow-hidden">
        {/* Large Background Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="text-[40rem] font-bold text-white/20 select-none">U</div>
        </div>

        {/* Diagonal Lines */}
        <div className="absolute top-0 right-0 w-full h-full">
          <div className="absolute top-0 right-0 w-1/2 h-full border-l-[3px] border-gray-800 transform rotate-12 origin-top-right"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full border-l-[3px] border-gray-800 transform rotate-12 origin-top-right translate-x-8"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">
          <div className="mb-4">
            <span className="text-lg font-medium">Ukuqala Medicals</span>
          </div>

          <h2 className="text-4xl font-bold mb-4">Welcome to Ukuqala Medicals</h2>

          <p className="text-gray-300 mb-2 max-w-md leading-relaxed">
            Ukuqala Medicals helps doctors to build orchestrated and well crafted dashboards full of beautiful and rich
            modules. Join us and start building your application today.
          </p>

          <p className="text-gray-400 mb-12 text-sm">More than 17k people joined us, it's your turn</p>

          {/* CTA Card */}
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md border border-gray-800">
            <h3 className="text-xl font-semibold mb-3">Get your right job and right place apply now</h3>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm max-w-xs">
                Be among the first founders to experience the easiest way to start run a business.
              </p>
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-[#1a1a1a]"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-[#1a1a1a]"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-[#1a1a1a]"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-[#1a1a1a]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
