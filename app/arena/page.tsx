'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Bell,
  Timer,
  Quote,
  FileText,
  PenLine,
  Gavel,
  LogOut,
  Send,
  Paperclip,
  Flame,
  Clapperboard,
  HelpCircle,
  Trash2,
  Trophy,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getAIResponse, saveMessage, evaluateDebate, forfeitDebate, concludeDebate } from '@/app/actions/debate';

const supabase = createClient();

const friends = [
  { id: '1', name: 'Sophia Rivers', rank: 'Philosopher King', avatar: 'https://picsum.photos/seed/sophia/100/100' },
  { id: '2', name: 'Marcus Thorne', rank: 'Logic Master', avatar: 'https://picsum.photos/seed/marcus/100/100' },
  { id: '3', name: 'Lisa Chen', rank: 'Grand Orator', avatar: 'https://picsum.photos/seed/lisa/100/100' },
  { id: '4', name: 'David Miller', rank: 'Debate Pro', avatar: 'https://picsum.photos/seed/david/100/100' },
  { id: '5', name: 'Elena Vance', rank: 'Rhetoric Expert', avatar: 'https://picsum.photos/seed/elena/100/100' },
  { id: 's0', name: 'Sophia Rivers', rank: 'Philosopher King', avatar: 'https://picsum.photos/seed/sophia/100/100' },
  { id: 's1', name: 'David Miller', rank: 'Debate Pro', avatar: 'https://picsum.photos/seed/david/100/100' },
  { id: 's2', name: 'Elena Vance', rank: 'Rhetoric Expert', avatar: 'https://picsum.photos/seed/elena/100/100' },
];

const models = {
  gemini: { name: 'Gemini 2.5 Flash', provider: 'Google' },
  openai: { name: 'GPT-4o', provider: 'OpenAI' },
  anthropic: { name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
};

interface Message {
  id: string;
  role: 'pro' | 'con';
  author: string;
  content: string;
  timestamp: string;
  isAI?: boolean;
}

import { Suspense } from 'react';

function ArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'ai';
  const topic = searchParams.get('topic') || 'The Impact of AI on Creative Arts';
  const modelId = searchParams.get('model') || 'gemini';
  const opponentId = searchParams.get('opponent') || '1';
  const timeLimitParam = searchParams.get('timeLimit') || '10';
  const debateDuration = parseInt(timeLimitParam) * 60;

  // -- State --
  const [userProfile, setUserProfile] = useState<any>(null);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [evaluationReason, setEvaluationReason] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(debateDuration);
  const [isStarted, setIsStarted] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isOpponentOnline, setIsOpponentOnline] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const [historyTopic, setHistoryTopic] = useState(topic);
  const [historyOpponent, setHistoryOpponent] = useState<any>({ name: 'Loading...', avatar: 'https://picsum.photos/seed/placeholder/100/100' });
  const startTimeParam = searchParams.get('startTime');

  const selectedOpponent = React.useMemo(() => mode === 'multi'
    ? friends.find(f => f.id === opponentId) || friends[0]
    : { name: models[modelId as keyof typeof models]?.name || 'AI Assistant', rank: 'AI Model', avatar: 'https://picsum.photos/seed/ai-bot/100/100' },
    [mode, opponentId, modelId]);

  // -- Initialization --
  useEffect(() => {
    async function init() {
      if (initRef.current) return;
      initRef.current = true;

      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      console.log("DEBUG: Current User:", user?.email);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        console.log("DEBUG: Profile loaded:", !!profile);
        setUserProfile(profile || { full_name: user.email?.split('@')[0] || 'User' });
      } else {
        console.warn("DEBUG: No user found during init");
        // We might want to redirect to login if user is null and not in history view
      }

      // 2. Load or Create Debate
      const existingId = searchParams.get('id');
      const historyId = searchParams.get('historyId');

      if (historyId) {
        setIsHistoryView(true);
        setIsStarted(true);
        setIsFinished(true);
        setDebateId(historyId);

        const { data: debate } = await supabase
          .from('debates')
          .select(`*`)
          .eq('id', historyId)
          .single();

        if (debate) {
          setHistoryTopic(debate.topic);
          setEvaluationReason(debate.evaluation_reason);

          const opponentId = debate.pro_user_id === user?.id ? debate.con_user_id : debate.pro_user_id;

          let opponentName = 'AI Assistant';
          let opponentAvatar = 'https://picsum.photos/seed/ai/100/100';

          if (opponentId) {
            const { data: opponentProfile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', opponentId).single();
            if (opponentProfile) {
              opponentName = opponentProfile.full_name || 'Opponent';
              opponentAvatar = opponentProfile.avatar_url || `https://picsum.photos/seed/${opponentId}/100/100`;
            }
          }

          setHistoryOpponent({ name: opponentName, avatar: opponentAvatar });

          // Helper to resolve winner name
          if (debate.winner_id === user?.id) {
            setWinner('You');
          } else if (debate.winner_id) {
            setWinner(opponentName);
          } else if (debate.evaluation_reason && debate.evaluation_reason.toLowerCase().includes('tie')) {
            setWinner('Tie');
          } else {
            setWinner(opponentName); // Assuming AI won if null and not a tie
          }
        }

        const { data: histMessages } = await supabase.from('messages').select('*').eq('debate_id', historyId).order('created_at', { ascending: true });
        if (histMessages) setMessages(histMessages);
      } else if (existingId) {
        setDebateId(existingId);
        setIsStarted(true);
        const { data: initialMessages } = await supabase.from('messages').select('*').eq('debate_id', existingId).order('created_at', { ascending: true });
        if (initialMessages) setMessages(initialMessages);
      } else if (mode === 'ai') {
        if (user) {
          console.log("DEBUG: Creating NEW AI Debate for topic:", topic);
          const { data: newDebate, error } = await supabase
            .from('debates')
            .insert({
              topic,
              time_limit: parseInt(timeLimitParam),
              mode: 'ai',
              status: 'live',
              pro_user_id: user.id
            })
            .select().single();

          if (error) {
            console.error("DEBUG: New AI Debate INSERT FAILED:", JSON.stringify(error));
            console.error("RAW ERROR OBJECT:", error);
            return;
          }

          if (newDebate) {
            console.log("DEBUG: New AI Debate created with ID:", newDebate.id);
            setDebateId(newDebate.id);
            setIsStarted(true);

            // Auto-start with a dynamic opening
            setIsThinking(true);
            await getAIResponse(newDebate.id, topic, []);
            setIsThinking(false);

            // Re-fetch to satisfy subscription race
            const { data: finalMessages } = await supabase.from('messages').select('*').eq('debate_id', newDebate.id).order('created_at', { ascending: true });
            if (finalMessages) setMessages(finalMessages);
          }
        } else {
          console.error("DEBUG: Cannot create AI debate - no user session");
        }
      } else {
        // For other modes, we still want the UI to be interactive if topic is present
        setIsStarted(true);
      }
    }
    init();
  }, [searchParams, mode, topic, timeLimitParam]);

  // -- Real-time Sync --
  useEffect(() => {
    if (!debateId) return;

    const channel = supabase
      .channel(`arena-${debateId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `debate_id=eq.${debateId}`
      }, (payload) => {
        setMessages(prev => {
          // Prevent duplicates from multiple event streams
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });

        // We now trigger AI response directly from handleSend to be more reliable
        // and avoid race conditions with the real-time subscription.
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [debateId, mode]);

  useEffect(() => {
    if (mode === 'ai') {
      setIsOpponentOnline(true);
      return;
    }
    const interval = setInterval(() => {
      if (Math.random() > 0.9) {
        setIsOpponentOnline(prev => !prev);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleAIResponse = async (userText: string) => {
    if (!debateId) return;
    setIsThinking(true);
    try {
      const historyForAi = messages.map(m => ({ role: m.role, content: m.content }));
      historyForAi.push({ role: 'pro', content: userText });

      console.log("DEBUG: Calling getAIResponse for debate:", debateId);
      const result = await getAIResponse(debateId, topic, historyForAi);

      if (result.error) {
        console.error("DEBUG: getAIResponse returned error:", result.error);
      } else {
        console.log("DEBUG: getAIResponse succeeded, refreshing messages...");
        // Manually refresh messages immediately after AI response to ensure visibility
        const { data: latest } = await supabase
          .from('messages')
          .select('*')
          .eq('debate_id', debateId)
          .order('created_at', { ascending: true });

        if (latest) {
          console.log("DEBUG: Messages refreshed manually. Count:", latest.length);
          setMessages(latest);
        }
      }
    } catch (err) {
      console.error("DEBUG: handleAIResponse exception:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async () => {
    console.log("DEBUG: handleSend attempt. State:", {
      input: !!input.trim(),
      debateId,
      userProfile: !!userProfile,
      userName: userProfile?.full_name || userProfile?.username || 'Unknown'
    });

    if (!input.trim()) return;
    if (!debateId) {
      console.error("DEBUG: handleSend failed - debateId is null");
      return;
    }
    if (!userProfile) {
      console.error("DEBUG: handleSend failed - userProfile is null");
      return;
    }

    const content = input;
    setInput('');

    try {
      const authorName = userProfile.full_name || userProfile.username || 'User';
      console.log("DEBUG: Calling saveMessage...", { debateId, role: 'pro', authorName });

      const result = await saveMessage(debateId, content, 'pro', authorName);

      if (result.success) {
        console.log("DEBUG: saveMessage success return");
        // Manually trigger a refresh to be safe
        const { data: latest } = await supabase.from('messages').select('*').eq('debate_id', debateId).order('created_at', { ascending: true });
        if (latest) setMessages(latest);

        // Trigger AI response immediately if in AI mode
        if (mode === 'ai') {
          await handleAIResponse(content);
        }
      } else {
        console.error("DEBUG: saveMessage returned success:false", result);
      }
    } catch (err) {
      console.error("DEBUG: handleSend exception:", err);
    }
  };

  // -- Timer & Scroll --
  useEffect(() => {
    if (!isStarted || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isFinished]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hrs: hrs.toString().padStart(2, '0'),
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0')
    };
  };

  const handleExit = (targetHref?: string) => {
    if (isFinished) {
      router.push(targetHref || '/debates');
      return true;
    }
    setPendingHref(targetHref || '/debates');
    setShowExitModal(true);
    return false;
  };

  const confirmExit = async () => {
    if (debateId) {
      try {
        await forfeitDebate(debateId);
      } catch (err) {
        console.error("Failed to forfeit debate:", err);
      }
    }
    router.push(pendingHref || '/debates');
    setShowExitModal(false);
  };

  useEffect(() => {
    if (!isFinished || isHistoryView || !debateId || !userProfile) return;

    async function concludeDebateProcess() {
      // Show "Calculating..." while waiting for AI
      setWinner('Calculating...');

      const userProfileName = userProfile?.full_name || 'User';
      const debateTopic = topic || 'Unknown Topic';
      const evaluation = await evaluateDebate(debateId as string, debateTopic, messages, userProfileName, selectedOpponent.name);

      let finalWinner = 'Tie';
      let winnerId = 'none';

      if (evaluation.winner === 'user') {
        finalWinner = userProfileName;
        winnerId = 'user';
      } else if (evaluation.winner === 'opponent') {
        finalWinner = selectedOpponent.name;
        winnerId = 'opponent';
      }

      setWinner(finalWinner);
      setEvaluationReason(evaluation.reasoning || 'No reasoning provided.');

      // Update DB via Server Action to bypass RLS
      await concludeDebate(debateId as string, winnerId, evaluation.reasoning || 'No reasoning provided.');
    }
    concludeDebateProcess();
  }, [isFinished, isHistoryView, debateId, messages, userProfile, selectedOpponent.name]);

  const time = formatTime(timeLeft);

  return (
    <div className="bg-[#f6f6f8] min-h-screen flex font-sans overflow-hidden">
      <Sidebar onNavigate={(href) => handleExit(href)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isStarted && startTimeParam ? (
          <main className="flex-1 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl w-full bg-white rounded-[40px] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-8"
            >
              <div className="size-24 bg-[#585bf3]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Timer className="w-12 h-12 text-[#585bf3]" />
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 leading-tight">
                  The Arena is <span className="text-[#585bf3]">Preparing</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
                  This debate hasn&apos;t started yet. The participants are gathering their thoughts and sharpening their logic.
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scheduled Start</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Date(startTimeParam).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })} at {new Date(startTimeParam).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="h-px bg-slate-200 w-12 mx-auto" />

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Countdown</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-4xl font-black tabular-nums text-[#585bf3]">{time.hrs}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400">Hrs</span>
                    </div>
                    <span className="text-2xl font-black text-slate-300">:</span>
                    <div className="flex flex-col">
                      <span className="text-4xl font-black tabular-nums text-[#585bf3]">{time.mins}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400">Min</span>
                    </div>
                    <span className="text-2xl font-black text-slate-300">:</span>
                    <div className="flex flex-col">
                      <span className="text-4xl font-black tabular-nums text-[#585bf3]">{time.secs}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400">Sec</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <p className="text-sm text-slate-400 font-medium italic">
                  &quot;The aim of argument, or of discussion, should not be victory, but progress.&quot;
                </p>
                <div className="flex items-center justify-center">
                  <Link
                    href="/debates"
                    className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                  >
                    Browse Other Debates
                  </Link>
                </div>
              </div>
            </motion.div>
          </main>
        ) : (
          <main className="flex-1 flex overflow-hidden">
            {/* Left Column: Debate Stream */}
            <section className="flex-1 flex flex-col relative bg-white">
              {/* Simple Header with Topic */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{isHistoryView ? historyTopic : topic}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-[#585bf3] uppercase tracking-widest">
                      {isHistoryView ? 'Debate Archive' : 'Live Debate Session'}
                    </p>
                    {!isHistoryView && startTimeParam && new Date(startTimeParam).getTime() < Date.now() && (
                      <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                        Late Entry
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="size-8 rounded-full border-2 border-white bg-blue-100 overflow-hidden relative">
                      <Image alt="Alex" src="https://picsum.photos/seed/alex/100/100" width={32} height={32} referrerPolicy="no-referrer" />
                      <div className="absolute bottom-0 right-0 size-2 rounded-full border border-white bg-emerald-500" />
                    </div>
                    <div className="size-8 rounded-full border-2 border-white bg-rose-100 overflow-hidden relative">
                      <Image alt={isHistoryView ? historyOpponent.name : selectedOpponent.name} src={isHistoryView ? historyOpponent.avatar : selectedOpponent.avatar} width={32} height={32} referrerPolicy="no-referrer" />
                      <div className={`absolute bottom-0 right-0 size-2 rounded-full border border-white ${isHistoryView ? 'bg-slate-300' : (isOpponentOnline ? 'bg-emerald-500' : 'bg-slate-300')}`} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleExit()}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 px-4 py-2 rounded-full border border-rose-100 hover:bg-rose-50 transition-all"
                  >
                    {isHistoryView ? 'Back to History' : 'Exit Arena'}
                  </button>
                </div>
              </div>

              {/* Chat Stream / Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'pro' ? 'items-start' : 'items-end'} gap-2 max-w-[80%] ${msg.role === 'con' ? 'ml-auto' : ''}`}
                    >
                      <div className={`flex items-center gap-2 mb-1 ${msg.role === 'con' ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-bold text-slate-900">{msg.author_name || msg.author}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.timestamp || '')}
                        </span>
                      </div>
                      <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'pro'
                        ? 'bg-white border border-slate-100 rounded-tl-none text-slate-800'
                        : 'bg-[#585bf3] text-white rounded-tr-none'
                        }`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-end gap-2 max-w-[80%] ml-auto"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                      <span className="text-xs font-bold text-slate-900">{selectedOpponent.name}</span>
                    </div>
                    <div className="bg-slate-100 p-5 rounded-2xl rounded-tr-none flex gap-1">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="size-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 bg-slate-400 rounded-full" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Debate Concluded Overlay */}
              <AnimatePresence>
                {isFinished && !isHistoryView && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-[40px] p-12 max-w-lg w-full text-center shadow-2xl space-y-8"
                    >
                      <div className="size-24 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
                        <Trophy className="w-12 h-12 text-emerald-600" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900">Debate Concluded</h2>
                        <p className="text-slate-500 font-medium">The judges have reached a verdict.</p>
                      </div>

                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Winner</p>
                          <p className="text-2xl font-black text-[#585bf3]">{winner}</p>
                        </div>

                        {evaluationReason && winner !== 'Calculating...' && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 mt-2">Judge's Reasoning</p>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed text-left block">
                              {evaluationReason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        <Link
                          href="/debates"
                          className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                        >
                          Return to Debates
                        </Link>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Exit Confirmation Modal */}
              <AnimatePresence>
                {showExitModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-8"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl space-y-8"
                    >
                      <div className="size-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto">
                        <LogOut className="w-10 h-10 text-rose-600" />
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-2xl font-black text-slate-900">Abandon Debate?</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          Exiting now will count as an <span className="text-rose-600 font-bold">automatic loss</span>. Your progress will be saved in your history as a forfeit.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 pt-2">
                        <button
                          onClick={confirmExit}
                          className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                        >
                          Yes, Exit and Forfeit
                        </button>
                        <button
                          onClick={() => setShowExitModal(false)}
                          className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                        >
                          Stay and Fight
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Fixed Input */}
              <div className="p-8 border-t border-slate-100 bg-white">
                <div className="max-w-4xl mx-auto relative flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#585bf3]/20 focus:border-[#585bf3] transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={isFinished ? "Debate has ended" : (isStarted ? "Type your argument..." : "Debate hasn't started yet")}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      disabled={!isStarted || isFinished}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!isStarted || !input.trim() || isFinished || !debateId}
                    className="bg-[#585bf3] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-[#585bf3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Right Column: Timer & Opponents */}
            <aside className="w-[320px] bg-[#f6f6f8] border-l border-slate-200 p-8 flex flex-col gap-10">
              {/* Timer Section */}
              {isStarted && !isHistoryView && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Time Remaining
                  </h3>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {time.hrs !== '00' && (
                        <>
                          <span className="text-4xl font-black tabular-nums text-slate-900">{time.hrs}</span>
                          <span className="text-3xl font-black text-[#585bf3]/30">:</span>
                        </>
                      )}
                      <span className="text-5xl font-black tabular-nums text-slate-900">{time.mins}</span>
                      <span className="text-4xl font-black text-[#585bf3]/30">:</span>
                      <span className="text-5xl font-black tabular-nums text-slate-900">{time.secs}</span>
                    </div>
                  </div>
                </div>
              )}

              {isHistoryView && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Debate Status
                  </h3>
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                    <Trophy className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-900">Concluded</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1">Winner: {winner}</p>
                  </div>
                </div>
              )}

              {/* Opponents Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Opponents</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                    <div className="size-10 rounded-full bg-blue-100 overflow-hidden ring-2 ring-blue-50 relative">
                      <Image alt="Alex" className="w-full h-full object-cover" src="https://picsum.photos/seed/alex/100/100" width={40} height={40} referrerPolicy="no-referrer" />
                      <div className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">Alex Rivera</p>
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
                          {isHistoryView ? 'Archived' : 'In Arena'}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">Affirmative</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                    <div className="size-10 rounded-full bg-rose-100 overflow-hidden ring-2 ring-rose-50 relative">
                      <Image alt={isHistoryView ? historyOpponent.name : selectedOpponent.name} className="w-full h-full object-cover" src={isHistoryView ? historyOpponent.avatar : selectedOpponent.avatar} width={40} height={40} referrerPolicy="no-referrer" />
                      <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${isHistoryView ? 'bg-slate-300' : (isOpponentOnline ? 'bg-emerald-500' : 'bg-slate-300')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">{isHistoryView ? historyOpponent.name : selectedOpponent.name}</p>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${isHistoryView ? 'bg-slate-100 text-slate-400' : (isOpponentOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}`}>
                          {isHistoryView ? 'Archived' : (isOpponentOnline ? 'In Arena' : 'Away')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-rose-500 uppercase">Opposition</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </main>
        )}
      </div>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Arena...</div>}>
      <ArenaContent />
    </Suspense>
  );
}
