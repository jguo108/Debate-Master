'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn, Shield, User } from 'lucide-react';
import Image from 'next/image';
import { login, signup } from './actions/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    if (isLogin) {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } else {
      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setMessage(result.success);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f6f8]">
      {/* Left Side: Brand Intro */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex">
        {/* Background Decoration */}
        <div className="absolute inset-0 soft-pop-gradient opacity-90"></div>
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 h-64 w-64 rounded-full bg-[#585bf3]/30 blur-3xl"></div>

        <div className="relative z-10 p-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#585bf3] shadow-lg">
              <Shield className="w-8 h-8" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">Debate Master</span>
          </div>
        </div>

        <div className="relative z-10 px-16 pb-24">
          <div className="max-w-xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md"
            >
              Evolution of Discourse
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl font-black leading-tight text-white mb-6"
            >
              Master the <br />Argument
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/80 leading-relaxed"
            >
              Join the world&apos;s premier platform for high-stakes intellectual discourse. Refine your logic, challenge your peers, and rise through the ranks in our global arena.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <Image
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white"
                    src={`https://picsum.photos/seed/user${i}/100/100`}
                    alt="User avatar"
                    width={40}
                    height={40}
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">12k+ Active Debaters</span>
                <span className="text-xs text-white/70">Join the community today</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 p-16 flex gap-8 text-white/60 text-sm">
          <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
          <span className="">© 2024 Debate Master</span>
        </div>
      </div>

      {/* Right Side: Auth Screen */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#585bf3] text-white">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">Debate Master</span>
          </div>

          <motion.div
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isLogin ? 'Welcome back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-slate-500">
              {isLogin ? 'Log in to your account to continue your climb.' : 'Every legend starts with a single argument.'}
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium"
            >
              {message}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="full_name">Full Name</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        className="block w-full rounded-xl border border-slate-200 bg-white px-11 py-3.5 text-slate-900 focus:border-[#585bf3] focus:ring-[#585bf3]/20 sm:text-sm transition-all shadow-sm"
                        id="full_name"
                        name="full_name"
                        placeholder="Alex Rivera"
                        type="text"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">Email Address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    className="block w-full rounded-xl border border-slate-200 bg-white px-11 py-3.5 text-slate-900 focus:border-[#585bf3] focus:ring-[#585bf3]/20 sm:text-sm transition-all shadow-sm"
                    id="email"
                    name="email"
                    placeholder="name@company.com"
                    type="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    className="block w-full rounded-xl border border-slate-200 bg-white px-11 py-3.5 text-slate-900 focus:border-[#585bf3] focus:ring-[#585bf3]/20 sm:text-sm transition-all shadow-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                    type="button"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center">
                <input
                  className="h-4 w-4 rounded border-slate-300 text-[#585bf3] focus:ring-[#585bf3]"
                  id="remember-me"
                  type="checkbox"
                />
                <label className="ml-2 block text-sm text-slate-600" htmlFor="remember-me">Keep me logged in</label>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-full bg-[#585bf3] py-4 px-4 text-sm font-bold text-white transition-all hover:bg-[#585bf3]/90 focus:outline-none focus:ring-2 focus:ring-[#585bf3] focus:ring-offset-2 shadow-lg shadow-[#585bf3]/25 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <LogIn className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                  </span>
                )}
                {isLogin ? 'Sign In to Debate' : 'Get Started'}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already a debater?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="font-bold text-[#585bf3] hover:underline ml-1"
            >
              {isLogin ? 'Sign up now' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
