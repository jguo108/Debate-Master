'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Cpu,
  Sparkles,
  Zap,
  Crown,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';
import { getAllowedAIModels, getAllowedTimeLimits, checkAIDebateAccess } from '@/app/actions/subscription';

const models = [
  {
    id: 'gemini',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Fast, multimodal, and highly creative reasoning.',
    color: 'from-blue-500 to-emerald-500',
    icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg'
  },
  {
    id: 'groq',
    name: 'Llama 3.3 70B Versatile',
    provider: 'Groq',
    description: 'Meta\'s 70B model with strong reasoning and multilingual support.',
    color: 'from-violet-500 to-fuchsia-500',
    icon: 'https://console.groq.com/favicon.ico'
  },
];

export default function PracticeSoloPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>('gemini');
  const [timeLimit, setTimeLimit] = useState('10');
  const [allowedModels, setAllowedModels] = useState<string[]>(['gemini']);
  const [allowedTimeLimits, setAllowedTimeLimits] = useState<number[]>([1, 5, 10]);
  const [accessCheck, setAccessCheck] = useState<{ allowed: boolean; reason?: string; usage?: { current: number; limit: number } } | null>(null);

  useEffect(() => {
    async function loadLimits() {
      const models = await getAllowedAIModels();
      const timeLimits = await getAllowedTimeLimits();
      setAllowedModels(models);
      setAllowedTimeLimits(timeLimits);
      
      // Check access
      const check = await checkAIDebateAccess();
      setAccessCheck(check);
      
      // Set default model if current selection is not allowed
      if (selectedModel && !models.includes(selectedModel)) {
        setSelectedModel(models[0] || null);
      }
      
      // Set default time limit if current selection is not allowed
      if (!timeLimits.includes(parseInt(timeLimit))) {
        setTimeLimit(timeLimits[0]?.toString() || '10');
      }
    }
    loadLimits();
  }, []);

  return (
    <div className="flex flex-1 min-w-0 h-full overflow-hidden bg-[#f6f6f8]">


      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <div className="px-8 py-12 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link href="/mode-selection" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Practice Solo</h1>
              <p className="text-slate-500 font-medium">Hone your arguments against world-class AI.</p>
            </div>
          </div>

          {/* Usage Warning */}
          {accessCheck && !accessCheck.allowed && (
            <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 mb-1">Monthly Limit Reached</h3>
                  <p className="text-sm text-amber-700 mb-3">{accessCheck.reason}</p>
                  <button
                    onClick={() => router.push('/settings')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )}

          {accessCheck && accessCheck.allowed && accessCheck.usage && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm text-blue-700">
                <span className="font-bold">{accessCheck.usage.current}</span> of <span className="font-bold">{accessCheck.usage.limit}</span> AI debates used this month
              </p>
            </div>
          )}

          <div className="space-y-8">
            {/* Topic Input */}
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#585bf3]" />
                1. What are we debating?
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., The ethics of genetic engineering"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#585bf3]/20 focus:border-[#585bf3] transition-all outline-none text-lg font-medium"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <p className="text-slate-400 text-xs mt-3 px-2">Choose a topic you want to master.</p>
            </section>

            {/* AI Model Selection */}
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#585bf3]" />
                2. Select Your AI Opponent
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {models.map((model) => {
                  const isAllowed = allowedModels.includes(model.id);
                  const isProOnly = !isAllowed;
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (isAllowed) {
                          setSelectedModel(model.id);
                        } else {
                          alert('This AI model requires Pro subscription. Upgrade to access GPT-4o and Claude 3.5 Sonnet.');
                        }
                      }}
                      disabled={!isAllowed}
                      className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${
                        selectedModel === model.id && isAllowed
                          ? 'border-[#585bf3] bg-[#585bf3]/5 ring-4 ring-[#585bf3]/5'
                          : isAllowed
                          ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          : 'border-slate-100 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {isProOnly && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-amber-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                          <Crown className="w-3 h-3" />
                          PRO
                        </div>
                      )}
                      
                      <div className={`size-16 rounded-2xl bg-gradient-to-br ${model.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                        <Sparkles className="w-8 h-8" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-[#585bf3] uppercase tracking-widest">{model.provider}</span>
                          {selectedModel === model.id && isAllowed && (
                            <span className="bg-[#585bf3] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">SELECTED</span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{model.name}</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{model.description}</p>
                      </div>

                      <div className="shrink-0">
                        <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedModel === model.id && isAllowed ? 'bg-[#585bf3] border-[#585bf3]' : 'border-slate-200'
                          }`}>
                          {selectedModel === model.id && isAllowed && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Time Limit Selection */}
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#585bf3]" />
                3. Set the Duration
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                {[1, 5, 10, 20, 30, 60].map((limit) => {
                  const isAllowed = allowedTimeLimits.includes(limit);
                  const isProOnly = limit > 10;
                  
                  return (
                    <button
                      key={limit}
                      onClick={() => {
                        if (isAllowed) {
                          setTimeLimit(limit.toString());
                        } else {
                          alert('Extended time limits (20+ minutes) require Pro subscription.');
                        }
                      }}
                      disabled={!isAllowed}
                      className={`py-4 rounded-2xl border-2 font-bold transition-all relative ${
                        timeLimit === limit.toString() && isAllowed
                          ? 'border-[#585bf3] bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20'
                          : isAllowed
                          ? 'border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                          : 'border-slate-100 text-slate-300 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {isProOnly && (
                        <Crown className="absolute -top-2 -right-2 w-4 h-4 text-amber-500" />
                      )}
                      {limit} Min
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Action */}
            <div className="flex justify-center pt-4">
              <button
                onClick={async () => {
                  if (!topic || !selectedModel) return;
                  
                  const check = await checkAIDebateAccess();
                  if (!check.allowed) {
                    alert(check.reason || 'Access denied');
                    return;
                  }
                  
                  router.push(`/arena?mode=ai&topic=${encodeURIComponent(topic)}&model=${selectedModel}&timeLimit=${timeLimit}`);
                }}
                disabled={!topic || !selectedModel || (accessCheck?.allowed === false)}
                className="group flex items-center gap-3 bg-[#585bf3] hover:bg-[#585bf3]/90 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xl px-12 py-5 rounded-full shadow-xl shadow-[#585bf3]/20 transition-all active:scale-95"
              >
                <Zap className="w-6 h-6 fill-current" />
                Initialize Training
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
