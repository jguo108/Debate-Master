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
import { recordAIDebateUsage } from '@/app/actions/subscription';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { getUserSubscriptionClient } from '@/lib/subscription/client';

const supabase = createClient();


const models = {
  gemini: { name: 'Gemini 2.5 Flash', provider: 'Google' },
  groq: { name: 'Llama 3', provider: 'Groq' },
  kimi: { name: 'Kimi K2', provider: 'Groq' },
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
  const modeFromUrl = searchParams.get('mode') || 'ai';
  const topicFromUrl = searchParams.get('topic');
  const modelId = searchParams.get('model') || 'gemini';
  const opponentIdParam = searchParams.get('opponent');
  const timeLimitParam = searchParams.get('timeLimit') || '10';
  const debateDuration = parseInt(timeLimitParam) * 60;

  // -- State --
  const [userProfile, setUserProfile] = useState<any>(null);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [channelInstance, setChannelInstance] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [evaluationReason, setEvaluationReason] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(debateDuration);
  const [isStarted, setIsStarted] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isWaitingToStart, setIsWaitingToStart] = useState(false);
  const [scheduledTimeMs, setScheduledTimeMs] = useState<number | null>(null);
  const [endTimeMs, setEndTimeMs] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [opponentForfeited, setOpponentForfeited] = useState(false);
  const [showForfeitWinModal, setShowForfeitWinModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const [historyTopic, setHistoryTopic] = useState(topicFromUrl || 'Loading Topic...');
  const [historyOpponent, setHistoryOpponent] = useState<any>({ name: 'Loading...', avatar: '/avatars/default.png' });
  const [activeMode, setActiveMode] = useState<string>(modeFromUrl);
  const [proParticipant, setProParticipant] = useState<any>({ id: null, name: 'Loading...', avatar: '/avatars/default.png' });
  const [conParticipant, setConParticipant] = useState<any>({ id: null, name: 'Loading...', avatar: '/avatars/default.png' });
  const [proSubscription, setProSubscription] = useState<{ tier: 'free' | 'pro' | null; isActive: boolean } | null>(null);
  const [conSubscription, setConSubscription] = useState<{ tier: 'free' | 'pro' | null; isActive: boolean } | null>(null);
  const startTimeParam = searchParams.get('startTime');

  const currentUserRole = (userProfile && conParticipant.id === userProfile.id) ? 'con' : 'pro';

  const selectedOpponent = React.useMemo(() => {
    if (activeMode === 'ai') {
      return { name: models[modelId as keyof typeof models]?.name || 'AI Assistant', avatar: '/avatars/default.png' };
    }

    // Determine opponent based on who the current user IS NOT
    if (userProfile && proParticipant.id && userProfile.id === proParticipant.id) {
      return conParticipant.name !== 'Loading...' ? conParticipant : { name: 'Opponent', avatar: '/avatars/default.png' };
    }

    // Fallback/Loading
    return conParticipant.name !== 'Loading...' ? conParticipant : { name: 'Opponent', avatar: '/avatars/default.png' };
  }, [activeMode, modelId, conParticipant, proParticipant, userProfile]);

  // -- Initialization --
  // -- Initialization --
  useEffect(() => {
    async function init() {
      if (initRef.current) return;
      initRef.current = true;

      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      console.log("DEBUG: Current User:", user?.email);
      let activeProfile: any = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        console.log("DEBUG: Profile loaded:", !!profile);
        activeProfile = profile || { full_name: user.email?.split('@')[0] || 'User' };
        setUserProfile(activeProfile);
      } else {
        console.warn("DEBUG: No user found during init");
      }

      // 2. Load or Create Debate
      const existingId = searchParams.get('id');
      const historyId = searchParams.get('historyId');

      if (historyId) {
        setIsHistoryView(true);
        setDebateId(historyId);

        const { data: debate } = await supabase
          .from('debates')
          .select(`*`)
          .eq('id', historyId)
          .single();

        setIsStarted(true);
        setIsFinished(true);

        if (debate) {
          setHistoryTopic(debate.topic);
          setEvaluationReason(debate.evaluation_reason);
          setActiveMode(debate.mode);

          let currentPro: any = { id: null, name: 'Affirmative', avatar: `/avatars/default.png` };
          let currentCon: any = { id: null, name: 'Opposition', avatar: `/avatars/default.png` };

          // Fetch Pro Profile
          if (debate.pro_user_id) {
            const { data: proProfile } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', debate.pro_user_id).single();
            if (proProfile) {
              const avatar = proProfile.avatar_url;
              currentPro = { id: proProfile.id, name: proProfile.full_name || 'Affirmative', avatar: (avatar && !avatar.includes('picsum.photos')) ? avatar : `/avatars/default.png` };
              setProParticipant(currentPro);
              // Fetch subscription for pro participant
              const proSub = await getUserSubscriptionClient(proProfile.id);
              setProSubscription(proSub);
            }
          }

          // Fetch Con Profile
          if (debate.con_user_id) {
            const { data: conProfile } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', debate.con_user_id).single();
            if (conProfile) {
              const avatar = conProfile.avatar_url;
              currentCon = { id: conProfile.id, name: conProfile.full_name || 'Opposition', avatar: (avatar && !avatar.includes('picsum.photos')) ? avatar : `/avatars/default.png` };
              setConParticipant(currentCon);
              // Fetch subscription for con participant
              const conSub = await getUserSubscriptionClient(conProfile.id);
              setConSubscription(conSub);
            }
          } else if (debate.mode === 'ai') {
            currentCon = { id: 'ai', name: (models as any)[debate.model || 'gemini']?.name || 'AI Assistant', avatar: '/avatars/default.png' };
            setConParticipant(currentCon);
            setConSubscription(null); // AI has no subscription
          }

          const myId = user?.id;
          const oppIsPro = myId === debate.con_user_id;
          const oppProfile = oppIsPro ? currentPro : currentCon;

          setHistoryOpponent({ name: oppProfile.name, avatar: oppProfile.avatar });

          // Helper to resolve winner name
          if (debate.winner_id === myId) {
            setWinner('You');
          } else if (debate.winner_id) {
            const winProfile = debate.winner_id === currentPro.id ? currentPro : currentCon;
            setWinner(winProfile.name || 'Opponent');
          } else {
            // For concluded debates, winner_id === null means it's a tie
            setWinner('Tie');
          }
        }

        const { data: histMessages } = await supabase.from('messages').select('*').eq('debate_id', historyId).order('created_at', { ascending: true });
        if (histMessages) setMessages(histMessages);
      } else if (existingId || (modeFromUrl === 'ai' && user)) {
        if (existingId) {
          setDebateId(existingId);

          const { data: debate } = await supabase
            .from('debates')
            .select('*')
            .eq('id', existingId)
            .single();

          if (debate) {
            setHistoryTopic(debate.topic);
            setActiveMode(debate.mode);

            let baseDuration = debate.time_limit ? debate.time_limit * 60 : 600;
            let startMs = debate.scheduled_at ? new Date(debate.scheduled_at).getTime() : new Date(debate.created_at || Date.now()).getTime();
            let currentEndMs = startMs + baseDuration * 1000;

            setEndTimeMs(currentEndMs);

            if (debate.scheduled_at) {
              setScheduledTimeMs(startMs);
              if (Date.now() < startMs) {
                setIsWaitingToStart(true);
                setTimeLeft(baseDuration);
              } else {
                const remaining = Math.max(0, Math.floor((currentEndMs - Date.now()) / 1000));
                setTimeLeft(remaining);
                if (remaining <= 0) setIsFinished(true);
              }
            } else {
              const remaining = Math.max(0, Math.floor((currentEndMs - Date.now()) / 1000));
              setTimeLeft(remaining);
              if (remaining <= 0) setIsFinished(true);
            }


            // Fetch Pro Profile
            if (debate.pro_user_id) {
              const { data: proProfile } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', debate.pro_user_id).single();
              if (proProfile) {
                const avatar = proProfile.avatar_url;
                setProParticipant({ id: proProfile.id, name: proProfile.full_name || 'Affirmative', avatar: (avatar && !avatar.includes('picsum.photos')) ? avatar : `/avatars/default.png` });
                // Fetch subscription for pro participant
                const proSub = await getUserSubscriptionClient(proProfile.id);
                setProSubscription(proSub);
              }
            }

            // Fetch Con Profile
            if (debate.con_user_id) {
              const { data: conProfile } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', debate.con_user_id).single();
              if (conProfile) {
                const avatar = conProfile.avatar_url;
                setConParticipant({ id: conProfile.id, name: conProfile.full_name || 'Opposition', avatar: (avatar && !avatar.includes('picsum.photos')) ? avatar : `/avatars/default.png` });
                // Fetch subscription for con participant
                const conSub = await getUserSubscriptionClient(conProfile.id);
                setConSubscription(conSub);
              }
            } else if (debate.mode === 'ai') {
              // Gracefully handle missing model column in older records
              const modelKey = debate.model || modelId || 'gemini';
              setConParticipant({
                id: 'ai',
                name: (models as any)[modelKey]?.name || 'AI Assistant',
                avatar: '/avatars/default.png'
              });
              setConSubscription(null); // AI has no subscription
            }
          }

          if (debate && debate.scheduled_at && Date.now() < new Date(debate.scheduled_at).getTime()) {
            setIsStarted(false);
          } else {
            setIsStarted(true);
          }

          const { data: initialMessages } = await supabase.from('messages').select('*').eq('debate_id', existingId).order('created_at', { ascending: true });
          if (initialMessages) setMessages(initialMessages);
        } else if (modeFromUrl === 'ai' && user) {
          console.log("DEBUG: Creating NEW AI Debate for topic:", topicFromUrl);
          const { data: newDebate, error } = await supabase
            .from('debates')
            .insert({
              topic: topicFromUrl || 'AI Debate',
              time_limit: parseInt(timeLimitParam),
              mode: 'ai',
              status: 'scheduled',
              pro_user_id: user.id,
              model: modelId // This is the column that might be missing
            })
            .select().single();

          if (error) {
            console.error("DEBUG: New AI Debate INSERT FAILED:", JSON.stringify(error));
            if (error.code === 'PGRST204' || error.message?.includes('model')) {
              console.warn("DEBUG: The 'model' column seems to be missing. Attempting fallback insert...");
              // Fallback attempt without the model column if the database hasn't been updated yet
              const { data: fallbackDebate, error: fallbackError } = await supabase
                .from('debates')
                .insert({
                  topic: topicFromUrl || 'AI Debate',
                  time_limit: parseInt(timeLimitParam),
                  mode: 'ai',
                  status: 'scheduled',
                  pro_user_id: user.id
                })
                .select().single();

              if (fallbackError) {
                console.error("DEBUG: Fallback AI Debate INSERT ALSO FAILED:", JSON.stringify(fallbackError));
                setIsInitialLoading(false);
                return;
              }

              if (fallbackDebate) {
                // Manually set debate Id and proceed
                initNewDebate(fallbackDebate, activeProfile, user);
                return;
              }
            }
            setIsInitialLoading(false);
            return;
          }

          if (newDebate) {
            // Record usage for subscription tracking
            try {
              await recordAIDebateUsage(newDebate.id);
            } catch (err) {
              console.error('Failed to record usage:', err);
            }
            initNewDebate(newDebate, activeProfile, user);
          }
        }
      } else {
        setIsStarted(true);
      }
      setIsInitialLoading(false);
    }

    // Helper to avoid code duplication in fallback
    async function initNewDebate(debate: any, activeProfile: any, user: any) {
      setDebateId(debate.id);
      setHistoryTopic(debate.topic);
      setIsStarted(true);
      const avatar = activeProfile?.avatar_url;
      setProParticipant({ id: user.id, name: activeProfile?.full_name || 'User', avatar: (avatar && !avatar.includes('picsum.photos')) ? avatar : `/avatars/default.png` });
      setConParticipant({ id: 'ai', name: (models as any)[modelId]?.name || 'AI Assistant', avatar: '/avatars/default.png' });
      
      // Fetch subscription for pro participant (current user)
      const proSub = await getUserSubscriptionClient(user.id);
      setProSubscription(proSub);
      setConSubscription(null); // AI has no subscription

      let baseDuration = debate.time_limit ? debate.time_limit * 60 : 600;
      let startMs = new Date(debate.created_at || Date.now()).getTime();
      const calculatedEndMs = startMs + baseDuration * 1000;
      setEndTimeMs(calculatedEndMs);

      const remaining = Math.max(0, Math.floor((calculatedEndMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) setIsFinished(true);

      // Auto-start with a dynamic opening
      setIsThinking(true);
      await getAIResponse(debate.id, debate.topic, []);
      setIsThinking(false);

      // Re-fetch to satisfy subscription race
      const { data: finalMessages } = await supabase.from('messages').select('*').eq('debate_id', debate.id).order('created_at', { ascending: true });
      if (finalMessages) setMessages(finalMessages);
    }

    init();
  }, [searchParams, activeMode, historyTopic, timeLimitParam, modelId]);

  // -- Real-time Sync --
  useEffect(() => {
    if (!debateId) return;

    // Use a shared channel name so both participants connect to the same presence channel
    const channelName = `arena-${debateId}`;
    const channel = supabase
      .channel(channelName, {
        config: {
          presence: { key: userProfile?.id || '' }
        },
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `debate_id=eq.${debateId}`
      }, (payload) => {
        const newMsg = payload.new as any;
        setMessages(prev => {
          // If this exact message ID already exists (real message), skip
          if (prev.some(m => m.id === newMsg.id)) return prev;

          // Replace any temp message from the same user with matching content
          const hasTempMatch = prev.some(
            m => String(m.id).startsWith('temp-') &&
              m.content === newMsg.content &&
              m.role === newMsg.role
          );

          if (hasTempMatch) {
            // Replace the first matching temp message with the real one
            let replaced = false;
            return prev.map(m => {
              if (!replaced &&
                String(m.id).startsWith('temp-') &&
                m.content === newMsg.content &&
                m.role === newMsg.role) {
                replaced = true;
                return newMsg;
              }
              return m;
            });
          }

          // No temp match found — this is a message from the opponent, just append
          return [...prev, newMsg];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'debates',
        filter: `id=eq.${debateId}`
      }, (payload) => {
        const newDebate = payload.new;
        if (newDebate.status === 'concluded' && newDebate.evaluation_reason?.includes('forfeited')) {
          setOpponentForfeited(true);
          if (newDebate.winner_id === userProfile?.id) {
            setShowForfeitWinModal(true);
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        // Flatten state to get unique user IDs present in the channel
        const userIds = new Set<string>();
        for (const id in newState) {
          const presences = newState[id] as any[];
          presences.forEach(p => {
            if (p.user_id) userIds.add(p.user_id);
          });
        }
        setOnlineUsers(userIds);
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence!
        if (userProfile?.id) {
          await channel.track({ user_id: userProfile.id });
        }
      }
    });

    setChannelInstance(channel);

    return () => {
      supabase.removeChannel(channel);
      setChannelInstance(null);
    };
  }, [debateId, userProfile]);

  // Removed random interval logic for opponent online status

  const handleAIResponse = async (userText: string) => {
    if (!debateId) return;
    setIsThinking(true);
    try {
      const historyForAi = messages.map(m => ({ role: m.role, content: m.content }));
      historyForAi.push({ role: currentUserRole, content: userText });

      console.log("DEBUG: Calling getAIResponse for debate:", debateId);
      const result = await getAIResponse(debateId, historyTopic, historyForAi);

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
    if (!input.trim() || isSending) return;
    if (!debateId || !userProfile) return;

    const content = input;
    setInput('');
    setIsSending(true);

    const authorName = userProfile.full_name || userProfile.username || 'User';

    // Optimistic Update — temp message shown instantly to sender
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      debate_id: debateId,
      role: currentUserRole,
      author_name: authorName,
      author: authorName,
      content,
      created_at: new Date().toISOString()
    }]);

    try {
      const result = await saveMessage(debateId, content, currentUserRole, authorName);

      if (result.success) {
        // postgres_changes will fire and replace the temp message with the real one.
        // No manual re-fetch or broadcast needed.

        // Trigger AI response immediately if in AI mode
        if (activeMode === 'ai') {
          await handleAIResponse(content);
        }
      } else {
        // Save failed — remove the optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch (err) {
      console.error("handleSend error:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // -- Timer & Scroll --
  useEffect(() => {
    if (!isStarted || isFinished || isWaitingToStart || !endTimeMs) return;

    const immediateRemaining = Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000));
    setTimeLeft(immediateRemaining);
    if (immediateRemaining <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsFinished(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isFinished, isWaitingToStart, endTimeMs]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  // -- Waiting to Start Check --
  useEffect(() => {
    if (!isWaitingToStart || !scheduledTimeMs) return;

    const checkInterval = setInterval(() => {
      if (Date.now() >= scheduledTimeMs) {
        setIsWaitingToStart(false);
        setIsStarted(true);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isWaitingToStart, scheduledTimeMs]);

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
    if (isFinished || isWaitingToStart) {
      router.push(targetHref || '/debates?tab=history');
      return true;
    }
    setPendingHref(targetHref || '/debates?tab=history');
    setShowExitModal(true);
    return false;
  };

  const confirmExit = async () => {
    setIsExiting(true);
    if (debateId) {
      try {
        await forfeitDebate(debateId);
      } catch (err) {
        console.error("Failed to forfeit debate:", err);
      }
    }
    router.push(pendingHref || '/debates?tab=history');
    // We intentionally DO NOT set showExitModal to false here
    // so the modal overlay stays visible while Next.js transitions,
    // thereby hiding the chat window underneath.
  };

  useEffect(() => {
    if (!isFinished || isHistoryView || !debateId || !userProfile || opponentForfeited) return;

    async function concludeDebateProcess() {
      // Show "Calculating..." while waiting for AI
      setWinner('Calculating...');

      const userProfileName = userProfile?.full_name || 'User';
      const debateTopic = historyTopic || 'Unknown Topic';
      const evaluation = await evaluateDebate(debateId as string, debateTopic, messages, userProfileName, selectedOpponent.name);

      // Handle evaluation errors - default to tie
      if (evaluation.error) {
        setWinner('Tie');
        setEvaluationReason('The evaluation could not be completed. The debate is considered a tie.');
        await concludeDebate(debateId as string, 'tie', 'The evaluation could not be completed. The debate is considered a tie.');
        return;
      }

      let finalWinner = 'Tie';
      let winnerId: 'user' | 'opponent' | 'tie' = 'tie';

      if (evaluation.winner === 'user') {
        finalWinner = userProfileName;
        winnerId = 'user';
      } else if (evaluation.winner === 'opponent') {
        finalWinner = selectedOpponent.name;
        winnerId = 'opponent';
      } else if (evaluation.winner === 'tie') {
        finalWinner = 'Tie';
        winnerId = 'tie';
      }

      setWinner(finalWinner);
      setEvaluationReason(evaluation.reasoning || 'No reasoning provided.');

      // Update DB via Server Action to bypass RLS
      await concludeDebate(debateId as string, winnerId, evaluation.reasoning || 'No reasoning provided.');
    }
    concludeDebateProcess();
  }, [isFinished, isHistoryView, debateId, messages, userProfile, selectedOpponent.name, opponentForfeited]);

  const time = formatTime(timeLeft);

  return (
    <div className="bg-[#f6f6f8] h-screen flex font-sans overflow-hidden">
      <Sidebar onNavigate={(href) => handleExit(href)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {isInitialLoading ? (
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#585bf3] animate-spin" />
              <p className="text-slate-500 font-medium animate-pulse">Entering Arena...</p>
            </div>
          </main>
        ) : !isStarted && startTimeParam ? (
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
                  <h1 className="text-xl font-bold text-slate-900">{historyTopic}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-[#585bf3] uppercase tracking-widest">
                      {isHistoryView ? 'Debate Archive' : (isWaitingToStart ? 'Scheduled Debate' : 'Live Debate Session')}
                    </p>
                    {!isHistoryView && isWaitingToStart && (
                      <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse whitespace-nowrap">
                        Waiting for Start Time
                      </span>
                    )}
                    {!isHistoryView && startTimeParam && !isWaitingToStart && new Date(startTimeParam).getTime() < Date.now() && (
                      <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse whitespace-nowrap">
                        Late Entry
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="size-8 rounded-full border-2 border-white bg-blue-100 overflow-hidden relative">
                      <Image alt={proParticipant.name} src={proParticipant.avatar} width={32} height={32} referrerPolicy="no-referrer" />
                      <div className={`absolute bottom-0 right-0 size-2 rounded-full border border-white ${isHistoryView ? 'bg-slate-300' : ((userProfile?.id === proParticipant.id || onlineUsers.has(proParticipant.id) || proParticipant.id === 'ai') ? 'bg-emerald-500' : 'bg-slate-300')}`} />
                      {proParticipant.id && proParticipant.id !== 'ai' && proSubscription && (
                        <SubscriptionBadge tier={proSubscription.tier} isActive={proSubscription.isActive} size="sm" position="top-right" />
                      )}
                    </div>
                    <div className="size-8 rounded-full border-2 border-white bg-rose-100 overflow-hidden relative">
                      <Image alt={isHistoryView ? historyOpponent.name : conParticipant.name} src={isHistoryView ? historyOpponent.avatar : conParticipant.avatar} width={32} height={32} referrerPolicy="no-referrer" />
                      <div className={`absolute bottom-0 right-0 size-2 rounded-full border border-white ${isHistoryView ? 'bg-slate-300' : ((userProfile?.id === conParticipant.id || onlineUsers.has(conParticipant.id) || conParticipant.id === 'ai') ? 'bg-emerald-500' : 'bg-slate-300')}`} />
                      {conParticipant.id && conParticipant.id !== 'ai' && conSubscription && (
                        <SubscriptionBadge tier={conSubscription.tier} isActive={conSubscription.isActive} size="sm" position="top-right" />
                      )}
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
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === currentUserRole ? 'items-end' : 'items-start'} gap-2 max-w-[80%] ${msg.role === currentUserRole ? 'ml-auto' : ''}`}
                    >
                      <div className={`flex items-center gap-2 mb-1 ${msg.role === currentUserRole ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-bold text-slate-900">{msg.author_name || msg.author}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.timestamp || '')}
                        </span>
                      </div>
                      <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role !== currentUserRole
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
                    className="flex flex-col items-start gap-2 max-w-[80%]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">{selectedOpponent.name}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl rounded-tl-none flex gap-1">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="size-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 bg-slate-400 rounded-full" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Waiting to Start Overlay */}
              <AnimatePresence>
                {isWaitingToStart && !isHistoryView && scheduledTimeMs && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="size-24 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-amber-200/50">
                      <Timer className="w-12 h-12 text-amber-600 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Debate Starting Soon</h2>
                    <p className="text-slate-600 font-medium text-lg max-w-md mx-auto mb-8 leading-relaxed">
                      The arena is locked until the scheduled start time. Use this time to prepare your arguments.
                    </p>
                    <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 min-w-[300px]">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Scheduled For</p>
                      <p className="text-2xl font-black text-[#585bf3]">
                        {new Date(scheduledTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm font-bold text-slate-500 mt-1">
                        {new Date(scheduledTimeMs).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                        {winner === 'Tie' ? (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Result</p>
                            <p className="text-2xl font-black text-amber-600">It's a Tie!</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Winner</p>
                            <p className="text-2xl font-black text-[#585bf3]">{winner}</p>
                          </div>
                        )}

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
                          href="/debates?tab=history"
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
                {showForfeitWinModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-8"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl space-y-8"
                    >
                      <div className="size-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
                        <Trophy className="w-10 h-10 text-emerald-600" />
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-2xl font-black text-slate-900">Opponent Fled!</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          Your opponent has abandoned the debate. You emerge victorious by default!
                        </p>
                      </div>

                      <div className="pt-2">
                        <Link
                          href="/debates?tab=history"
                          className="block w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Claim Victory
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
                          disabled={isExiting}
                          className="flex items-center justify-center gap-2 w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExiting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Exiting...
                            </>
                          ) : (
                            "Yes, Exit and Forfeit"
                          )}
                        </button>
                        <button
                          onClick={() => setShowExitModal(false)}
                          disabled={isExiting}
                          className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      placeholder={isFinished ? "Debate has ended" : (isWaitingToStart ? "Waiting for debate start time..." : (isStarted ? "Type your argument..." : "Loading..."))}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      disabled={!isStarted || isFinished || isWaitingToStart}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!isStarted || !input.trim() || isFinished || !debateId || isWaitingToStart}
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
                  {/* Affirmative Participant */}
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                    <div className="size-10 rounded-full bg-blue-100 overflow-hidden ring-2 ring-blue-50 relative">
                      <Image alt={proParticipant.name} className="w-full h-full object-cover" src={proParticipant.avatar} width={40} height={40} referrerPolicy="no-referrer" />
                      <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${isHistoryView ? 'bg-slate-300' : ((userProfile?.id === proParticipant.id || onlineUsers.has(proParticipant.id) || proParticipant.id === 'ai') ? 'bg-emerald-500' : 'bg-slate-300')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{proParticipant.name}</p>
                          {proParticipant.id && proParticipant.id !== 'ai' && proSubscription ? (
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap min-w-[32px] h-[18px] flex items-center justify-center leading-none ${
                              proSubscription.tier === 'pro' && proSubscription.isActive 
                                ? 'bg-amber-50 text-amber-600/70' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {proSubscription.tier === 'pro' && proSubscription.isActive ? 'Pro' : 'Free'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap min-w-[32px] h-[18px] flex items-center justify-center leading-none opacity-0 pointer-events-none">
                              Pro
                            </span>
                          )}
                        </div>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap min-w-[60px] text-center ${isHistoryView ? 'bg-slate-100 text-slate-400' : ((userProfile?.id === proParticipant.id || onlineUsers.has(proParticipant.id) || proParticipant.id === 'ai') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}`}>
                          {isHistoryView ? 'Archived' : ((userProfile?.id === proParticipant.id || onlineUsers.has(proParticipant.id) || proParticipant.id === 'ai') ? 'In Arena' : 'Away')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">Affirmative</p>
                    </div>
                  </div>

                  {/* Opposition Participant */}
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                    <div className="size-10 rounded-full bg-rose-100 overflow-hidden ring-2 ring-rose-50 relative">
                      <Image alt={isHistoryView ? historyOpponent.name : conParticipant.name} className="w-full h-full object-cover" src={isHistoryView ? historyOpponent.avatar : conParticipant.avatar} width={40} height={40} referrerPolicy="no-referrer" />
                      <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${isHistoryView ? 'bg-slate-300' : ((userProfile?.id === conParticipant.id || onlineUsers.has(conParticipant.id) || conParticipant.id === 'ai') ? 'bg-emerald-500' : 'bg-slate-300')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{isHistoryView ? historyOpponent.name : conParticipant.name}</p>
                          {conParticipant.id && conParticipant.id !== 'ai' && conSubscription ? (
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap min-w-[32px] h-[18px] flex items-center justify-center leading-none ${
                              conSubscription.tier === 'pro' && conSubscription.isActive 
                                ? 'bg-amber-50 text-amber-600/70' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {conSubscription.tier === 'pro' && conSubscription.isActive ? 'Pro' : 'Free'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap min-w-[32px] h-[18px] flex items-center justify-center leading-none opacity-0 pointer-events-none">
                              Pro
                            </span>
                          )}
                        </div>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap min-w-[60px] text-center ${isHistoryView ? 'bg-slate-100 text-slate-400' : ((userProfile?.id === conParticipant.id || onlineUsers.has(conParticipant.id) || conParticipant.id === 'ai') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}`}>
                          {isHistoryView ? 'Archived' : ((userProfile?.id === conParticipant.id || onlineUsers.has(conParticipant.id) || conParticipant.id === 'ai') ? 'In Arena' : 'Away')}
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
