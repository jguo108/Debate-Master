'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  History, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Check, 
  X, 
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Trophy,
  Mic2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

const initialHistories = [
  { 
    id: 'h1',
    title: "AI & Creative Rights", 
    outcome: "Won", 
    date: "Oct 12, 2023",
    opponent: "Marcus Thorne",
    image: "https://picsum.photos/seed/ai/600/400",
    score: "88/100"
  },
  { 
    id: 'h2',
    title: "Nuclear Energy Future", 
    outcome: "Lost", 
    date: "Sep 28, 2023",
    opponent: "Sophia Rivers",
    image: "https://picsum.photos/seed/nuclear/600/400",
    score: "72/100"
  },
  { 
    id: 'h3',
    title: "Space Exploration Tax", 
    outcome: "Won", 
    date: "Sep 15, 2023",
    opponent: "Lisa Chen",
    image: "https://picsum.photos/seed/space/600/400",
    score: "94/100"
  }
];

const initialScheduled = [
  {
    id: 's0',
    title: "The Ethics of Artificial Intelligence",
    date: "Mar 5, 2026",
    time: "06:24", // SIMULATION: Started 5 minutes ago relative to current time 06:29. Join now to see 5 mins remaining.
    timeLimit: "10",
    opponent: "Sophia Rivers",
    avatar: "https://picsum.photos/seed/sophia/100/100"
  },
  {
    id: 's1',
    title: "Universal Basic Income",
    date: "Mar 10, 2026",
    time: "14:00",
    timeLimit: "20",
    opponent: "David Miller",
    avatar: "https://picsum.photos/seed/david/100/100"
  },
  {
    id: 's2',
    title: "Genetic Engineering Ethics",
    date: "Mar 15, 2026",
    time: "10:30",
    timeLimit: "30",
    opponent: "Elena Vance",
    avatar: "https://picsum.photos/seed/elena/100/100"
  }
];

const initialPending = [
  {
    id: 'p1',
    type: 'sent',
    title: "Cryptocurrency Regulation",
    opponent: "Sophia Rivers",
    avatar: "https://picsum.photos/seed/sophia/100/100",
    status: "Waiting for response"
  },
  {
    id: 'p2',
    type: 'received',
    title: "Mental Health in Schools",
    opponent: "Marcus Thorne",
    avatar: "https://picsum.photos/seed/marcus/100/100",
    status: "Invitation received"
  }
];

function DebatesContent() {
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'history' | 'scheduled' | 'pending'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'scheduled' || tab === 'history') {
      return tab as any;
    }
    return 'history';
  });

  const [histories, setHistories] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = JSON.parse(localStorage.getItem('debate_history') || '[]');
      return [...savedHistory, ...initialHistories];
    }
    return initialHistories;
  });

  const [scheduled, setScheduled] = useState(() => {
    let baseScheduled = initialScheduled;
    
    // Filter out finished debates
    if (typeof window !== 'undefined') {
      const finishedDebates = JSON.parse(localStorage.getItem('finished_debates') || '[]');
      baseScheduled = initialScheduled.filter(s => !finishedDebates.includes(s.id));
    }

    return baseScheduled;
  });
  
  const [pending, setPending] = useState(() => {
    const isNewChallenge = searchParams.get('newChallenge');
    if (isNewChallenge === 'true') {
      const topic = searchParams.get('topic') || 'New Debate';
      const opponent = searchParams.get('opponent') || 'Friend';
      const date = searchParams.get('date') || 'TBD';
      const time = searchParams.get('time') || 'TBD';
      const timeLimit = searchParams.get('timeLimit') || '10';

      return [
        {
          id: 'new-challenge',
          type: 'sent',
          title: topic,
          opponent: opponent,
          avatar: `https://picsum.photos/seed/${opponent}/100/100`,
          status: `Scheduled for ${date} at ${time} (${timeLimit} min)`,
          timeLimit: timeLimit
        },
        ...initialPending
      ];
    }
    return initialPending;
  });

  const handleAccept = (id: string) => {
    // In a real app, this would move to scheduled
    const item = pending.find(p => p.id === id);
    if (item) {
      setScheduled([...scheduled, {
        id: `s-accepted-${item.id}`,
        title: item.title,
        date: "TBD",
        time: "TBD",
        timeLimit: (item as any).timeLimit || "10",
        opponent: item.opponent,
        avatar: item.avatar
      }]);
      setPending(pending.filter(p => p.id !== id));
    }
  };

  const handleDecline = (id: string) => {
    setPending(pending.filter(p => p.id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f6f8]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <div className="px-8 py-10 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Debates</h1>
            <p className="text-slate-500 text-lg mt-2">Manage your past, present, and future intellectual battles.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-8 p-1.5 bg-white rounded-2xl border border-slate-200 w-fit">
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history' ? 'bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button 
              onClick={() => setActiveTab('scheduled')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scheduled' ? 'bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Scheduled
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pending' ? 'bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending
              {pending.length > 0 && (
                <span className={`size-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === 'pending' ? 'bg-white text-[#585bf3]' : 'bg-[#585bf3] text-white'}`}>
                  {pending.length}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'history' && (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {histories.map((item) => (
                    <Link 
                      key={item.id} 
                      href={item.id.startsWith('h-') ? `/arena?historyId=${item.id}` : '#'}
                      className={`bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group ${item.id.startsWith('h-') ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4">
                        <Image 
                          src={item.image} 
                          alt={item.title} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.outcome === 'Won' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {item.outcome}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <Calendar className="w-3.5 h-3.5" /> {item.date} • vs {item.opponent}
                      </div>
                      <div className="flex items-center justify-end pt-4 border-t border-slate-50">
                        {item.id.startsWith('h-') && (
                          <span className="text-[10px] font-bold text-[#585bf3] uppercase tracking-widest flex items-center gap-1">
                            View History <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}

              {activeTab === 'scheduled' && (
                <motion.div 
                  key="scheduled"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {scheduled.length > 0 ? scheduled.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center text-[#585bf3]">
                          <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                              <Clock className="w-4 h-4" />
                              {item.date} at {item.time}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                              <User className="w-4 h-4" />
                              vs {item.opponent}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Image 
                          src={item.avatar} 
                          alt={item.opponent} 
                          width={40} 
                          height={40} 
                          className="size-10 rounded-full border-2 border-white shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <Link 
                          href={`/arena?mode=${(item as any).mode || 'multi'}&topic=${encodeURIComponent(item.title)}&opponent=${item.id}&startTime=${encodeURIComponent(`${item.date} ${item.time}`)}&timeLimit=${item.timeLimit}`}
                          className="px-6 py-2.5 bg-[#585bf3] text-white rounded-xl text-sm font-bold hover:bg-[#585bf3]/90 transition-all shadow-lg shadow-[#585bf3]/20"
                        >
                          Enter
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                      <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900">No scheduled debates</h3>
                      <p className="text-slate-500 mt-2">Challenge a friend to get started.</p>
                      <Link href="/debate/challenge" className="mt-6 inline-block text-[#585bf3] font-bold hover:underline">
                        Find an opponent
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'pending' && (
                <motion.div 
                  key="pending"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {pending.length > 0 ? pending.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`size-16 rounded-2xl flex items-center justify-center ${item.type === 'sent' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}`}>
                          {item.type === 'sent' ? <ArrowRight className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              item.type === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {item.type === 'sent' ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium mt-1">
                            <User className="w-4 h-4" />
                            {item.type === 'sent' ? `To ${item.opponent}` : `From ${item.opponent}`} • {item.status}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.type === 'received' ? (
                          <>
                            <button 
                              onClick={() => handleAccept(item.id)}
                              className="size-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDecline(item.id)}
                              className="size-11 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleDecline(item.id)}
                            className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                      <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900">No pending invitations</h3>
                      <p className="text-slate-500 mt-2">All your requests have been handled.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DebatesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Debates...</div>}>
      <DebatesContent />
    </Suspense>
  );
}
