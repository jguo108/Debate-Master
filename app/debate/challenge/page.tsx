'use client';

import React, { useState, Suspense } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Zap,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';

const friends = [
  { id: '1', name: 'Sarah Jenkins', rank: 'Master Level', avatar: 'https://picsum.photos/seed/sarah/100/100', status: 'Online' },
  { id: '2', name: 'David Chen', rank: 'Diamond II', avatar: 'https://picsum.photos/seed/david/100/100', status: 'In Debate' },
  { id: '3', name: 'Maria Garcia', rank: 'Platinum I', avatar: 'https://picsum.photos/seed/maria/100/100', status: 'Offline' },
  { id: '4', name: 'Jordan Smith', rank: 'Challenger', avatar: 'https://picsum.photos/seed/jordan/200/200', status: 'Online' },
  { id: '5', name: 'Sophia Rivers', rank: 'Philosopher King', avatar: 'https://picsum.photos/seed/sophia/100/100', status: 'Online' },
  { id: '6', name: 'Marcus Thorne', rank: 'Logic Master', avatar: 'https://picsum.photos/seed/marcus/100/100', status: 'Online' },
];

function ChallengeFriendContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendName = searchParams.get('friend');
  const initialFriend = friendName ? friends.find(f => f.name.toLowerCase() === friendName.toLowerCase()) : null;

  const [topic, setTopic] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(initialFriend?.id || null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeLimit, setTimeLimit] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedFriendData = friends.find(f => f.id === selectedFriend);

  const handleSendChallenge = () => {
    if (!topic || !selectedFriend || !date || !time) return;
    
    // In a real app, we would save this to a database
    // For this demo, we'll redirect to the debates page with a query param
    router.push(`/debates?tab=pending&newChallenge=true&topic=${encodeURIComponent(topic)}&opponent=${encodeURIComponent(selectedFriendData?.name || '')}&date=${date}&time=${time}&timeLimit=${timeLimit}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f6f8]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <div className="px-8 py-12 max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                  <Link href="/mode-selection" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                  </Link>
                  <div>
                    <h1 className="text-3xl font-black text-slate-900">Challenge a Friend</h1>
                    <p className="text-slate-500 font-medium">Set the stage for a legendary discourse.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Topic Input */}
                  <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#585bf3]" />
                      1. Define the Motion
                    </h2>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g., Should AI have legal personhood?" 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#585bf3]/20 focus:border-[#585bf3] transition-all outline-none text-lg font-medium"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-3 px-2">This will be the central theme of your debate.</p>
                  </section>

                  {/* Friend Selection */}
                  <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#585bf3]" />
                        2. Choose Your Opponent
                      </h2>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search friends..." 
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#585bf3] transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredFriends.map((friend) => (
                        <button
                          key={friend.id}
                          onClick={() => setSelectedFriend(friend.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                            selectedFriend === friend.id 
                              ? 'border-[#585bf3] bg-[#585bf3]/5 ring-4 ring-[#585bf3]/5' 
                              : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="relative">
                            <Image 
                              src={friend.avatar} 
                              alt={friend.name} 
                              width={48} 
                              height={48} 
                              className="rounded-full"
                              referrerPolicy="no-referrer"
                            />
                            <div className={`absolute bottom-0 right-0 size-3 border-2 border-white rounded-full ${
                              friend.status === 'Online' ? 'bg-green-500' : friend.status === 'In Debate' ? 'bg-amber-500' : 'bg-slate-300'
                            }`}></div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-slate-900 truncate">{friend.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{friend.rank}</p>
                          </div>
                          {selectedFriend === friend.id && (
                            <CheckCircle className="w-5 h-5 text-[#585bf3] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Date & Time Selection */}
                  <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#585bf3]" />
                      3. Schedule the Duel
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                        <input 
                          type="date" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#585bf3]/20 focus:border-[#585bf3] transition-all outline-none font-medium"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Time</label>
                        <input 
                          type="time" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#585bf3]/20 focus:border-[#585bf3] transition-all outline-none font-medium"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Time Limit Selection */}
                  <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#585bf3]" />
                      4. Set the Duration
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {['1', '5', '10', '20', '30', '60'].map((limit) => (
                        <button
                          key={limit}
                          onClick={() => setTimeLimit(limit)}
                          className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                            timeLimit === limit 
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
                      onClick={handleSendChallenge}
                      disabled={!topic || !selectedFriend || !date || !time}
                      className="group flex items-center gap-3 bg-[#585bf3] hover:bg-[#585bf3]/90 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xl px-12 py-5 rounded-full shadow-xl shadow-[#585bf3]/20 transition-all active:scale-95"
                    >
                      <Zap className="w-6 h-6 fill-current" />
                      Send Challenge
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function ChallengeFriendPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#f6f6f8] text-slate-500">Loading challenge setup...</div>}>
      <ChallengeFriendContent />
    </Suspense>
  );
}
