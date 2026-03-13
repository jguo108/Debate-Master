'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  History,
  Calendar,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Trophy,
  Mic2,
  Loader2,
  Trash2
} from 'lucide-react';
import { deleteDebate } from '@/app/actions/debate';
import Link from 'next/link';
import Image from 'next/image';

import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const initialHistories = [];

const initialScheduled = [
  {
    id: 's0',
    title: "The Ethics of Artificial Intelligence",
    date: "Mar 5, 2026",
    time: "06:24", // SIMULATION: Started 5 minutes ago relative to current time 06:29. Join now to see 5 mins remaining.
    timeLimit: "10",
    opponent: "Sophia Rivers",
    avatar: "/avatars/1.png"
  },
  {
    id: 's1',
    title: "Universal Basic Income",
    date: "Mar 10, 2026",
    time: "14:00",
    timeLimit: "20",
    opponent: "David Miller",
    avatar: "/avatars/2.png"
  },
  {
    id: 's2',
    title: "Genetic Engineering Ethics",
    date: "Mar 15, 2026",
    time: "10:30",
    timeLimit: "30",
    opponent: "Elena Vance",
    avatar: "/avatars/3.png"
  }
];

const initialPending: any[] = [];

import useSWR from 'swr';

function DebatesContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'history' | 'scheduled' | 'pending'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'scheduled' || tab === 'history') {
      return tab as any;
    }
    return 'history';
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    action: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    action: () => { }
  });

  const [selectedDebate, setSelectedDebate] = useState<any | null>(null);

  const fetchDebatesData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { histories: [], scheduled: [], pending: [] };

    // Check subscription tier for history limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .single();
    
    const isPro = profile?.subscription_tier === 'pro' && 
      (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());
    const historyLimit = isPro ? null : 10; // null means unlimited

    const histPromise = supabase
      .from('debates')
      .select(`*`)
      .eq('status', 'concluded')
      .or(`pro_user_id.eq.${user.id},con_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(historyLimit || 1000); // Apply limit if free tier

    const schedPromise = supabase
      .from('debates')
      .select(`*`)
      .eq('status', 'scheduled')
      .neq('mode', 'ai')
      .neq('status', 'cancelled')
      .or(`pro_user_id.eq.${user.id},con_user_id.eq.${user.id}`)
      .order('scheduled_at', { ascending: false });

    const pendPromise = supabase
      .from('debates')
      .select(`*`)
      .eq('status', 'pending')
      .neq('status', 'cancelled')
      .or(`pro_user_id.eq.${user.id},con_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const [histRes, schedRes, pendRes] = await Promise.all([histPromise, schedPromise, pendPromise]);

    // Gather all opponent IDs for a single bulk profile fetch to avoid N+1 problem
    const allDebates = [...(histRes.data || []), ...(schedRes.data || []), ...(pendRes.data || [])];
    const opponentIds = new Set<string>();

    allDebates.forEach(d => {
      const oppId = d.pro_user_id === user.id ? d.con_user_id : d.pro_user_id;
      if (oppId) opponentIds.add(oppId);
    });

    const profilesMap = new Map<string, any>();
    if (opponentIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(opponentIds));

      if (profiles) {
        profiles.forEach(p => profilesMap.set(p.id, p));
      }
    }

    const mapOpponent = (d: any, isSentRequest = false) => {
      let opponentId = d.pro_user_id === user.id ? d.con_user_id : d.pro_user_id;
      if (isSentRequest) opponentId = d.con_user_id;

      const p = opponentId ? profilesMap.get(opponentId) : null;
      const avatar = p?.avatar_url;
      return {
        name: p?.full_name || (opponentId ? 'Anonymous' : 'AI Assistant'),
        avatar: (avatar && !avatar.includes('picsum.photos')) ? avatar : "/avatars/default.png"
      };
    };

    const enrichedHist = (histRes.data || [])
      .filter(d => {
        if (d.pro_user_id === user.id && d.pro_deleted) return false;
        if (d.con_user_id === user.id && d.con_deleted) return false;
        return true;
      })
      .map(d => {
        const opp = mapOpponent(d);
        // For concluded debates: winner_id === user.id means Won, null means Tie, otherwise Lost.
        // Exception: if user forfeited (left early) vs AI, winner_id is null but it should show as Lost.
        let outcome: 'Won' | 'Tie' | 'Lost';
        if (d.winner_id === user.id) {
          outcome = 'Won';
        } else if (d.winner_id === null) {
          const isForfeitVsAi = d.mode === 'ai' && (d.evaluation_reason?.toLowerCase().includes('forfeited') ?? false);
          outcome = isForfeitVsAi ? 'Lost' : 'Tie';
        } else {
          outcome = 'Lost';
        }
        return {
          id: d.id,
          title: d.topic,
          outcome,
          date: new Date(d.created_at).toLocaleDateString(),
          opponent: opp.name,
          image: d.mode === 'ai' ? '/2.png' : '/1.jpg',
          score: "N/A"
        };
      });

    const enrichedSched = (schedRes.data || [])
      .filter(d => {
        if (d.pro_user_id === user.id && d.pro_deleted) return false;
        if (d.con_user_id === user.id && d.con_deleted) return false;
        return true;
      })
      .map(d => {
        const opp = mapOpponent(d);
        const scheduledTime = new Date(d.scheduled_at || d.created_at).getTime();
        const limitMs = (d.time_limit || 10) * 60 * 1000;
        const isOverdue = Date.now() > (scheduledTime + limitMs);

        return {
          id: d.id,
          title: d.topic,
          date: new Date(d.scheduled_at || d.created_at).toLocaleDateString(),
          time: new Date(d.scheduled_at || d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeLimit: d.time_limit.toString(),
          opponent: opp.name,
          avatar: opp.avatar,
          mode: d.mode,
          isOverdue
        };
      });

    const enrichedPend = (pendRes.data || []).map(d => {
      const isSent = d.pro_user_id === user.id;
      // For pending requests "sent", the opponent is always con_user_id
      const opp = mapOpponent(d, isSent);

      return {
        id: d.id,
        title: d.topic,
        date: new Date(d.scheduled_at || d.created_at).toLocaleDateString(),
        time: new Date(d.scheduled_at || d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeLimit: d.time_limit?.toString() || "10",
        opponent: opp.name,
        avatar: opp.avatar,
        type: isSent ? 'sent' : 'received',
        status: d.status
      };
    });

    return { histories: enrichedHist, scheduled: enrichedSched, pending: enrichedPend };
  };

  const { data, error, isLoading, mutate } = useSWR('user_debates_data', fetchDebatesData, {
    revalidateOnFocus: false
  });

  useEffect(() => {
    // Subscribe to all changes in the debates table
    const channel = supabase
      .channel('debates-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debates'
        },
        (payload) => {
          console.log('Debate update detected, revalidating...', payload);
          mutate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  const histories = data?.histories || [];
  const scheduled = data?.scheduled || [];
  const pending = data?.pending || [];
  const loading = isLoading;

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('debates')
        .update({ status: 'scheduled' })
        .eq('id', id);

      if (error) {
        console.error("Failed to accept debate:", error);
        return;
      }

      const item = pending.find(p => p.id === id);
      if (item) {
        // Optimistically update
        mutate((currentData: any) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            scheduled: [...currentData.scheduled, item],
            pending: currentData.pending.filter((p: any) => p.id !== id)
          };
        }, false);
      }
    } catch (err) {
      console.error("Failed to accept debate:", err);
    }
  };

  const handleDecline = async (e: React.MouseEvent, id: string, isSenderCancel = false) => {
    e.stopPropagation();
    const actionName = isSenderCancel ? "cancel request" : "decline debate";
    setConfirmModal({
      isOpen: true,
      title: isSenderCancel ? "Cancel Request" : "Decline Debate",
      message: `Are you sure you want to ${actionName}?`,
      confirmText: isSenderCancel ? "Yes" : "Decline",
      action: async () => {
        try {
          const { error } = await supabase
            .from('debates')
            .update({ status: 'cancelled' })
            .eq('id', id);

          if (error) {
            console.error(`Failed to ${actionName}:`, error);
            return;
          }

          mutate((currentData: any) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              pending: currentData.pending.filter((p: any) => p.id !== id)
            };
          }, false);
        } catch (err) {
          console.error(`Failed to ${actionName}:`, err);
        }
      }
    });
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setConfirmModal({
      isOpen: true,
      title: "Delete Debate",
      message: "Are you sure you want to delete this debate from your history?",
      confirmText: "Delete",
      action: async () => {
        try {
          console.log(`DEBUG: Attempting to delete debate ${id}`);
          const result = await deleteDebate(id);
          console.log(`DEBUG: Delete result:`, result);

          if (result.success) {
            mutate((currentData: any) => {
              if (!currentData) return currentData;
              return {
                ...currentData,
                histories: currentData.histories.filter((h: any) => h.id !== id),
                scheduled: currentData.scheduled.filter((s: any) => s.id !== id)
              }
            }, false);
          } else {
            alert(`Failed to delete: ${result.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error("Failed to delete debate:", err);
          alert("An unexpected error occurred while deleting the debate.");
        }
      }
    });
  };

  return (
    <div className="flex flex-1 min-w-0 h-full overflow-hidden bg-[#f6f6f8]">


      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <div className="px-8 pt-16 lg:pt-24 pb-10 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-12 relative">
            <Link
              href="/mode-selection"
              className="absolute left-0 top-0 flex items-center gap-2 text-slate-500 hover:text-[#585bf3] font-bold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4"
              >
                Debates
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 text-lg max-w-2xl mx-auto"
              >
                Manage your past, present, and future intellectual battles.
              </motion.p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-4 p-1.5 bg-white rounded-2xl border border-slate-200 w-fit">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'scheduled' ? 'bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                <Calendar className="w-4 h-4" />
                Scheduled
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-[#585bf3] text-white shadow-lg shadow-[#585bf3]/20' : 'text-slate-500 hover:bg-slate-50'
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
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#585bf3] animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Fetching your debates...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {histories.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {histories.map((item) => (
                          <Link
                            key={item.id}
                            href={`/arena?historyId=${item.id}`}
                            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                          >
                            <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.outcome === 'Won' ? 'bg-emerald-500 text-white' :
                                item.outcome === 'Tie' ? 'bg-amber-500 text-white' :
                                  'bg-rose-500 text-white'
                                }`}>
                                {item.outcome}
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                              <Calendar className="w-3.5 h-3.5" /> {item.date} • vs {item.opponent}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <button
                                onClick={(e) => handleDeleteHistory(e, item.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                title="Delete History"
                                type="button"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-bold text-[#585bf3] uppercase tracking-widest flex items-center gap-1">
                                View History <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No debate history</h3>
                        <p className="text-slate-500 mt-2">Your completed battles will appear here.</p>
                        <Link href="/mode-selection" className="mt-6 inline-block text-[#585bf3] font-bold hover:underline">
                          Start a new debate
                        </Link>
                      </div>
                    )}
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
                      <div key={item.id} onClick={() => setSelectedDebate(item)} className={`bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${item.isOverdue ? 'border-amber-100 opacity-80 hover:border-amber-300' : 'border-slate-100 hover:border-[#585bf3]/30'}`}>
                        <div className="flex items-center gap-6">
                          <div className={`size-16 rounded-2xl flex items-center justify-center ${item.isOverdue ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-[#585bf3]'}`}>
                            <Calendar className="w-8 h-8" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                              {item.isOverdue && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-600">
                                  Overdue
                                </span>
                              )}
                            </div>
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
                          {item.isOverdue ? (
                            <button
                              onClick={(e) => handleDeleteHistory(e, item.id)}
                              className="size-11 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                              title="Delete Overdue Debate"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          ) : (
                            <Link
                              href={`/arena?id=${item.id}&mode=${item.mode || 'ai'}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-6 py-2.5 bg-[#585bf3] text-white rounded-xl text-sm font-bold hover:bg-[#585bf3]/90 transition-all shadow-lg shadow-[#585bf3]/20"
                            >
                              Enter
                            </Link>
                          )}
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
                      <div key={item.id} onClick={() => setSelectedDebate(item)} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#585bf3]/30 transition-all">
                        <div className="flex items-center gap-6">
                          <div className={`size-16 rounded-2xl flex items-center justify-center ${item.type === 'sent' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}`}>
                            {item.type === 'sent' ? <ArrowRight className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.type === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
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
                                onClick={(e) => handleAccept(e, item.id)}
                                className="size-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => handleDecline(e, item.id)}
                                className="size-11 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => handleDecline(e, item.id, true)}
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
                        <h3 className="text-xl font-bold text-slate-900">No pending requests</h3>
                        <p className="text-slate-500 mt-2">All your invitations have been handled.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main >

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden z-10 border border-slate-100"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
                <p className="text-slate-500 mb-6 font-medium">{confirmModal.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    {confirmModal.title === "Cancel Request" ? "No" : "Cancel"}
                  </button>
                  <button
                    onClick={async () => {
                      await confirmModal.action();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-colors ${confirmModal.confirmText.includes('Delete') || confirmModal.confirmText.toLowerCase().includes('cancel') || confirmModal.confirmText.includes('Decline') || confirmModal.title === "Cancel Request"
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20'
                      : 'bg-[#585bf3] hover:bg-[#585bf3]/90 shadow-lg shadow-[#585bf3]/20'
                      }`}
                  >
                    {confirmModal.confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedDebate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setSelectedDebate(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden z-10 border border-slate-100"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Debate Details</h3>
                  <button onClick={() => setSelectedDebate(null)} className="p-2 -mr-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Topic</p>
                    <p className="font-medium text-slate-900 leading-snug">{selectedDebate.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <Calendar className="w-4 h-4 text-[#585bf3]" />
                        {selectedDebate.date}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <Clock className="w-4 h-4 text-[#585bf3]" />
                        {selectedDebate.time}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</p>
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <History className="w-4 h-4 text-slate-400" />
                        {selectedDebate.timeLimit} Minutes
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Opponent</p>
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <Image src={selectedDebate.avatar} alt={selectedDebate.opponent || 'Avatar'} width={24} height={24} className="rounded-full border border-slate-200" />
                        <span className="truncate">{selectedDebate.opponent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setSelectedDebate(null)}
                    className="w-full py-3 bg-[#585bf3] hover:bg-[#585bf3]/90 shadow-lg shadow-[#585bf3]/20 text-white font-bold rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
}

export default function DebatesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Debates...</div>}>
      <DebatesContent />
    </Suspense>
  );
}
