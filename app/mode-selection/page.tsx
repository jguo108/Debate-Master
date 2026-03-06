'use client';

import React, { useState } from 'react';
import {
  Users,
  Bot as SmartToy,
  Megaphone as Campaign,
  Edit,
  Info,
  ArrowRight as ArrowForward,
  Landmark as AccountBalance,
  CheckCircle,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';

export default function ModeSelection() {
  const [selectedMode, setSelectedMode] = useState<'multi' | 'ai' | null>(null);
  const [topic, setTopic] = useState('');

  return (
    <div className="bg-[#f6f6f8] min-h-screen font-sans text-slate-900 flex">
      <Sidebar />
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center pt-20 lg:pt-32 px-6 lg:px-12 pb-12 relative">
          {/* Background Decorative Elements */}
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#585bf3]/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#585bf3]/10 rounded-full blur-[150px] pointer-events-none"></div>

          <div className="w-full max-w-5xl z-10">
            <div className="text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl lg:text-5xl font-black tracking-tight mb-4"
              >
                Select Your Debate Mode
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 text-lg max-w-2xl mx-auto"
              >
                Choose how you want to sharpen your persuasion skills today. Whether with friends or solo, we&apos;ve got you covered.
              </motion.p>
            </div>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Challenge Friend Card */}
              <Link
                href="/debate/challenge"
                className="group relative flex flex-col gap-6 p-8 rounded-2xl bg-white border-2 border-transparent transition-all duration-300 text-left shadow-xl hover:shadow-[#585bf3]/20 hover:border-[#585bf3] hover:ring-4 hover:ring-[#585bf3]/10"
              >
                <div className="w-full aspect-video rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#585bf3]/40 to-transparent z-10"></div>
                  <Image
                    alt="Challenge Friend"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src="https://picsum.photos/seed/debate-multi/800/450"
                    width={800}
                    height={450}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 z-20 bg-[#585bf3] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Multiplayer</div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-8 h-8 text-[#585bf3]" />
                    <h3 className="text-2xl font-bold">Challenge Friend</h3>
                  </div>
                  <p className="text-slate-500 mb-4 leading-relaxed">
                    Invite a peer for a real-time verbal duel. Battle for logic, wit, and superior points.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-[#585bf3]" /> Real-time live scoring
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-[#585bf3]" /> Peer review system
                    </li>
                  </ul>
                </div>
              </Link>

              {/* Practice Solo Card */}
              <Link
                href="/debate/practice"
                className="group relative flex flex-col gap-6 p-8 rounded-2xl bg-white border-2 border-transparent transition-all duration-300 text-left shadow-xl hover:shadow-[#585bf3]/20 hover:border-[#585bf3] hover:ring-4 hover:ring-[#585bf3]/10"
              >
                <div className="w-full aspect-video rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-transparent z-10"></div>
                  <Image
                    alt="Practice Solo"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src="https://picsum.photos/seed/debate-ai/800/450"
                    width={800}
                    height={450}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 z-20 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">AI Training</div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 text-[#585bf3]" />
                    <h3 className="text-2xl font-bold">Practice Solo</h3>
                  </div>
                  <p className="text-slate-500 mb-4 leading-relaxed">
                    Hone your skills against our advanced AI model designed to find logic gaps.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-[#585bf3]" /> Instant AI feedback
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-[#585bf3]" /> Unlimited attempts
                    </li>
                  </ul>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
