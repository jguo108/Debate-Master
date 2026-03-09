'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Cpu,
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';

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
    id: 'openai',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'The industry standard for logical consistency and nuance.',
    color: 'from-slate-700 to-slate-900',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg'
  },
  {
    id: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Exceptional at nuanced writing and ethical reasoning.',
    color: 'from-orange-400 to-rose-600',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/1200px-Anthropic_logo.svg.png'
  },
];

export default function PracticeSoloPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState('10');

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
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${selectedModel === model.id
                      ? 'border-[#585bf3] bg-[#585bf3]/5 ring-4 ring-[#585bf3]/5'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className={`size-16 rounded-2xl bg-gradient-to-br ${model.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                      <Sparkles className="w-8 h-8" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-[#585bf3] uppercase tracking-widest">{model.provider}</span>
                        {selectedModel === model.id && (
                          <span className="bg-[#585bf3] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">SELECTED</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{model.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{model.description}</p>
                    </div>

                    <div className="shrink-0">
                      <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedModel === model.id ? 'bg-[#585bf3] border-[#585bf3]' : 'border-slate-200'
                        }`}>
                        {selectedModel === model.id && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Time Limit Selection */}
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#585bf3]" />
                3. Set the Duration
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                {['1', '5', '10', '20', '30', '60'].map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setTimeLimit(limit)}
                    className={`py-4 rounded-2xl border-2 font-bold transition-all ${timeLimit === limit
                      ? 'border-[#585bf3] bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20'
                      : 'border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {limit} Min
                  </button>
                ))}
              </div>
            </section>

            {/* Action */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  if (!topic || !selectedModel) return;
                  router.push(`/arena?mode=ai&topic=${encodeURIComponent(topic)}&model=${selectedModel}&timeLimit=${timeLimit}`);
                }}
                disabled={!topic || !selectedModel}
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
