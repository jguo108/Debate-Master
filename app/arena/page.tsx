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
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

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
  const startTimeParam = searchParams.get('startTime');
  const timeLimitParam = searchParams.get('timeLimit') || '10';
  const debateDuration = parseInt(timeLimitParam) * 60;

  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [isStarted, setIsStarted] = useState(() => {
    if (!startTimeParam) return true;
    const now = new Date();
    const startTime = new Date(startTimeParam);
    return now.getTime() >= startTime.getTime();
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!startTimeParam) return debateDuration;
    const now = new Date();
    const startTime = new Date(startTimeParam);
    const diff = startTime.getTime() - now.getTime();
    
    if (diff > 0) {
      return Math.floor(diff / 1000);
    } else {
      const elapsed = Math.floor(Math.abs(diff) / 1000);
      const remaining = debateDuration - elapsed;
      return remaining > 0 ? remaining : 0;
    }
  });
  const [isOpponentOnline, setIsOpponentOnline] = useState(true);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedOpponent = React.useMemo(() => mode === 'multi' 
    ? friends.find(f => f.id === opponentId) || friends[0]
    : { name: models[modelId as keyof typeof models]?.name || 'AI Assistant', rank: 'AI Model', avatar: 'https://picsum.photos/seed/ai-bot/100/100' },
  [mode, opponentId, modelId]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'pro',
      author: 'Alex Rivera',
      content: `I'm ready to debate the topic: "${topic}". I believe the affirmative position holds the most logical weight.`,
      timestamp: '14:05'
    },
    {
      id: '2',
      role: 'con',
      author: selectedOpponent.name,
      content: `Interesting opening, Alex. However, regarding "${topic}", there are significant counter-arguments that must be addressed. I'll be representing the opposition.`,
      timestamp: '14:08'
    }
  ]);

  const [historyTopic, setHistoryTopic] = useState(topic);
  const [historyOpponent, setHistoryOpponent] = useState(selectedOpponent);

  useEffect(() => {
    const historyId = searchParams.get('historyId');
    if (historyId) {
      const savedHistory = JSON.parse(localStorage.getItem('debate_history') || '[]');
      const historyItem = savedHistory.find((h: any) => h.id === historyId);
      if (historyItem) {
        setMessages(historyItem.messages);
        setWinner(historyItem.outcome === 'Won' ? 'Alex Rivera' : historyItem.opponent);
        setIsFinished(true);
        setIsStarted(true);
        setIsHistoryView(true);
        setHistoryTopic(historyItem.title);
        setHistoryOpponent({
          name: historyItem.opponent,
          rank: 'Debater',
          avatar: historyItem.opponentAvatar || 'https://picsum.photos/seed/ai-bot/100/100'
        });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (isHistoryView) return; // Don't run timer in history view
    const timer = setInterval(() => {
      const now = new Date();
      
      if (startTimeParam) {
        const startTime = new Date(startTimeParam);
        const diff = startTime.getTime() - now.getTime();

        if (diff > 0) {
          // Debate hasn't started yet
          setIsStarted(false);
          setTimeLeft(Math.floor(diff / 1000));
        } else {
          // Debate has started
          setIsStarted(true);
          const elapsed = Math.floor(Math.abs(diff) / 1000);
          const remaining = debateDuration - elapsed;
          if (remaining <= 0) {
            setIsStarted(true);
            setTimeLeft(0);
            setIsFinished(true);
          } else {
            setIsStarted(true);
            setTimeLeft(remaining);
          }
        }
      } else {
        // No start time (AI mode or direct entry), just start the timer
        setIsStarted(true);
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTimeParam, debateDuration, isHistoryView]);

  useEffect(() => {
    if (isHistoryView) return; // Don't save again if viewing history
    if (isFinished && !winner) {
      // Determine winner based on message count or random for now
      const proCount = messages.filter(m => m.role === 'pro').length;
      const conCount = messages.filter(m => m.role === 'con').length;
      
      let debateWinner = '';
      if (proCount > conCount) debateWinner = 'Alex Rivera';
      else if (conCount > proCount) debateWinner = selectedOpponent.name;
      else debateWinner = Math.random() > 0.5 ? 'Alex Rivera' : selectedOpponent.name;
      
      setWinner(debateWinner);

      // Save to history
      const historyItem = {
        id: `h-${Date.now()}`,
        title: topic,
        outcome: debateWinner === 'Alex Rivera' ? 'Won' : 'Lost',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        opponent: selectedOpponent.name,
        image: `https://picsum.photos/seed/${topic.length}/600/400`,
        score: `${Math.floor(Math.random() * 20) + 75}/100`,
        messages: messages,
        opponentAvatar: selectedOpponent.avatar
      };

      const savedHistory = JSON.parse(localStorage.getItem('debate_history') || '[]');
      localStorage.setItem('debate_history', JSON.stringify([historyItem, ...savedHistory]));
      
      // Also mark this scheduled debate as finished if it was one
      if (searchParams.get('opponent')) {
        const finishedDebates = JSON.parse(localStorage.getItem('finished_debates') || '[]');
        localStorage.setItem('finished_debates', JSON.stringify([...finishedDebates, searchParams.get('opponent')]));
      }
    }
  }, [isFinished, winner, messages, selectedOpponent, topic, searchParams, isHistoryView]);

  useEffect(() => {
    if (mode === 'ai') {
      setIsOpponentOnline(true);
      return;
    }
    const interval = setInterval(() => {
      // 10% chance to toggle status for demo purposes
      if (Math.random() > 0.9) {
        setIsOpponentOnline(prev => !prev);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

  const formatLongCountdown = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hrs > 0) parts.push(`${hrs} hour${hrs !== 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
    
    if (parts.length === 0) return "less than a minute";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    
    const last = parts.pop();
    return `${parts.join(', ')}, and ${last}`;
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !isFinished && !isHistoryView) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStarted, isFinished, isHistoryView]);

  const handleSend = async () => {
    if (!isStarted || !input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'pro',
      author: 'Alex Rivera',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (mode === 'ai') {
      setIsThinking(true);
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              role: "user",
              parts: [{ text: `You are a world-class debater. The topic is: "${topic}". 
              The current debate state is a series of arguments. 
              The user just said: "${input}". 
              Respond as the "CON" (opposition) side. Be concise, sharp, and logical. 
              Keep your response under 100 words.` }]
            }
          ],
          config: {
            systemInstruction: "You are a highly intellectual and competitive debater named Marcus Thorne. You are currently in a high-stakes debate competition. Your tone is professional, slightly provocative, and deeply logical."
          }
        });

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'con',
          author: selectedOpponent.name,
          content: response.text || "I'm processing your argument...",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: true
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("AI Error:", error);
      } finally {
        setIsThinking(false);
      }
    }
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the current chat history?')) {
      setMessages([]);
    }
  };

  const handleExit = (targetHref?: string) => {
    if (isHistoryView || isFinished) {
      if (targetHref) router.push(targetHref);
      else router.push('/debates');
      return true;
    }

    if (isStarted && !isFinished) {
      setPendingHref(targetHref || '/debates');
      setShowExitModal(true);
      return false; // Block immediate navigation for sidebar
    } else {
      if (targetHref) router.push(targetHref);
      else router.push('/debates');
      return true;
    }
  };

  const confirmExit = () => {
    // Save to history immediately as a loss
    const historyItem = {
      id: `h-${Date.now()}`,
      title: topic,
      outcome: 'Lost',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      opponent: selectedOpponent.name,
      image: `https://picsum.photos/seed/${topic.length}/600/400`,
      score: `${Math.floor(Math.random() * 10) + 40}/100`,
      messages: messages,
      opponentAvatar: selectedOpponent.avatar
    };

    const savedHistory = JSON.parse(localStorage.getItem('debate_history') || '[]');
    localStorage.setItem('debate_history', JSON.stringify([historyItem, ...savedHistory]));
    
    if (searchParams.get('opponent')) {
      const finishedDebates = JSON.parse(localStorage.getItem('finished_debates') || '[]');
      localStorage.setItem('finished_debates', JSON.stringify([...finishedDebates, searchParams.get('opponent')]));
    }

    router.push(pendingHref || '/debates');
    setShowExitModal(false);
  };

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
                        <span className="text-xs font-bold text-slate-900">{msg.author}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                      </div>
                      <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'pro' 
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
                      
                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Winner</p>
                        <p className="text-2xl font-black text-[#585bf3]">{winner || 'Calculating...'}</p>
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
                    disabled={!isStarted || !input.trim() || isFinished}
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
