'use client';

import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  MessageSquare,
  Swords,
  X,
  Check,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const FriendCard = ({ name, personality, avatar, onChat, isOnline }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-all">
    <div className="flex items-center gap-5 w-full lg:w-auto">
      <div className="relative">
        <div className="size-14 rounded-full bg-slate-100 overflow-hidden">
          <Image
            className="size-full object-cover"
            src={avatar}
            alt={name}
            width={56}
            height={56}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className={`absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900">{name}</h3>
          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="text-xs text-slate-500">{personality}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
      <Link
        href={`/debate/challenge?friend=${encodeURIComponent(name)}`}
        className="flex-1 lg:flex-none px-6 py-2.5 bg-[#585bf3] text-white text-sm font-bold rounded-xl hover:bg-[#585bf3]/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#585bf3]/20"
      >
        <Swords className="w-4 h-4" />
        Challenge
      </Link>
      <button
        onClick={onChat}
        className="p-2.5 rounded-xl bg-slate-50 text-[#585bf3] hover:bg-slate-100 transition-colors border border-slate-200"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const ChatModal = ({ friend, onClose }: { friend: any, onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Hey! I'm ${friend.name}. How's it going?` }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-100 overflow-hidden">
              <Image src={friend.avatar} alt={friend.name} width={40} height={40} className="size-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">{friend.name}</h3>
              <p className={`text-[10px] font-medium flex items-center gap-1 ${friend.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                <span className={`size-1.5 rounded-full ${friend.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                {friend.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 no-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                ? 'bg-[#585bf3] text-white rounded-tr-none'
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#585bf3]/50 text-sm transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-[#585bf3] text-white rounded-xl hover:bg-[#585bf3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#585bf3]/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default function FriendManager() {
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [potentialFriends, setPotentialFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<any>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [mainSearchQuery, setMainSearchQuery] = useState('');

  React.useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setUser(authUser);

      // Fetch friends
      const { data: friendshipData } = await supabase
        .from('friendships')
        .select(`
          status,
          friend:friend_id(id, full_name, avatar_url, specialty, rank)
        `)
        .eq('user_id', authUser.id)
        .eq('status', 'accepted');

      if (friendshipData) {
        setFriends(friendshipData.map((f: any) => ({
          id: f.friend.id,
          name: f.friend.full_name || 'Anonymous',
          personality: f.friend.specialty || 'General Expert',
          avatar: f.friend.avatar_url || `https://picsum.photos/seed/${f.friend.id}/200/200`,
          isOnline: Math.random() > 0.5 // Simulated for now
        })));
      }
      setLoading(false);
    }
    init();
  }, []);

  React.useEffect(() => {
    if (!modalSearchQuery.trim() || !user) {
      setPotentialFriends([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${modalSearchQuery}%`)
        .neq('id', user.id)
        .limit(10);

      if (profiles) {
        setPotentialFriends(profiles.map(p => ({
          id: p.id,
          name: p.full_name || 'Anonymous',
          personality: p.specialty || 'General Expert',
          avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/200/200`,
          isOnline: Math.random() > 0.5
        })));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [modalSearchQuery, user]);

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(mainSearchQuery.toLowerCase()) ||
    f.personality.toLowerCase().includes(mainSearchQuery.toLowerCase())
  );

  const addFriend = async (friend: any) => {
    if (!user) return;
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friend.id,
        status: 'accepted' // Auto-accept for demo purposes
      });

    if (!error) {
      setFriends([...friends, friend]);
      setPotentialFriends(potentialFriends.filter(pf => pf.id !== friend.id));
    }
  };

  return (
    <div className="bg-[#f6f6f8] min-h-screen font-sans text-slate-900">
      <AnimatePresence>
        {chatFriend && (
          <ChatModal friend={chatFriend} onClose={() => setChatFriend(null)} />
        )}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Find New Partners</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#585bf3]/50 text-sm transition-all"
                  />
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                  {potentialFriends.length > 0 ? (
                    potentialFriends.filter(pf => !friends.find(f => f.id === pf.id)).map((pf) => (
                      <div key={pf.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="size-10 rounded-full bg-slate-200 overflow-hidden">
                              <Image src={pf.avatar} alt={pf.name} width={40} height={40} className="size-full object-cover" />
                            </div>
                            <div className={`absolute bottom-0 right-0 size-2.5 rounded-full border border-white ${pf.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-slate-900">{pf.name}</p>
                              <span className={`size-1.5 rounded-full ${pf.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </div>
                            <p className="text-[10px] text-slate-500">{pf.personality}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addFriend(pf)}
                          className="p-2 bg-[#585bf3]/10 text-[#585bf3] rounded-lg hover:bg-[#585bf3] hover:text-white transition-all"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-400">No new partners found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1">
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#f6f6f8] overflow-y-auto no-scrollbar">
            <div className="max-w-5xl w-full mx-auto p-6 lg:p-10 space-y-8">
              {/* Page Header & Search */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Friend Manager</h1>
                    <p className="text-slate-500">Manage your circle of debate partners, coaches, and rivals.</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#585bf3] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#585bf3]/30 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Add New Friend</span>
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#585bf3] transition-colors" />
                  </div>
                  <input
                    className="block w-full pl-14 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-[#585bf3]/50 text-slate-900 placeholder-slate-400 transition-all"
                    placeholder="Search friends by name, rank, or debate specialty..."
                    type="text"
                    value={mainSearchQuery}
                    onChange={(e) => setMainSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Friends List */}
              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
                    <Loader2 className="w-10 h-10 text-[#585bf3] animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading your circle...</p>
                  </div>
                ) : filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      name={friend.name}
                      personality={friend.personality}
                      avatar={friend.avatar}
                      isOnline={friend.isOnline}
                      onChat={() => setChatFriend(friend)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400">No friends found matching your search.</p>
                  </div>
                )}
              </div>

              {/* Footer Info */}
              <div className="text-center pt-8 border-t border-slate-200 pb-12">
                <p className="text-sm text-slate-500">Showing {filteredFriends.length} of {friends.length} friends. <button className="text-[#585bf3] font-bold hover:underline">Load more</button></p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
